'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Trash2, Copy, Zap } from 'lucide-react'
import JobPreferencesCard from './JobPreferencesCard'
import SearchResultsCard from './SearchResultsCard'
import JobDetailModal from './JobDetailModal'
import { useChatHistory, useInfiniteChatHistory, useSaveChatMessage, useDeleteChatHistory } from '@/hooks/useChatApi'
import { useChatStore } from '@/stores/chatStore'

const hi_msg = '안녕하세요! AI 챗봇입니다.\n원하시는 일자리 조건을 자유롭게 말씀해주세요.\n예: "수원에서 주말 알바 구해요, 시급 15,000원 이상"'

// UUID 생성 함수 (고유 ID 보장)
const generateUniqueId = (() => {
  let counter = 0
  return () => `msg_${Date.now()}_${counter++}_${Math.random().toString(36).substr(2, 9)}`
})()

interface Message {
  id: string | number  // DB에서 온 경우 number, 클라이언트 생성은 string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface UserJobPreferences {
  gender: string | null
  age: string | number | null
  place: string | null
  work_days: string | null
  start_time: string | null
  end_time: string | null
  hourly_wage: string | number | null
  category: string | null
  requirements: string | null
}

interface ChatbotProps {
  userId: number
}

export default function Chatbot({ userId }: ChatbotProps) {
  // ✅ Zustand store 사용 (전역 상태 관리)
  const messages = useChatStore((state) => state.messages)
  const setMessages = useChatStore((state) => state.setMessages)
  const addMessage = useChatStore((state) => state.addMessage)
  const prependMessages = useChatStore((state) => state.prependMessages)
  const clearMessages = useChatStore((state) => state.clearMessages)
  
  // ✅ TanStack Query 무한 스크롤
  const {
    data: infiniteChatData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingHistory,
    isError: isChatHistoryError,
    error: chatHistoryError,
    refetch: refetchChatHistory,
  } = useInfiniteChatHistory(true)
  
  // ✅ 채팅 저장/삭제 mutation
  const saveMutation = useSaveChatMessage()
  const deleteMutation = useDeleteChatHistory()
  
  const [isClient, setIsClient] = useState(false)
  const [fastapiServer, setFastapiServer] = useState('')
  
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [userPreferences, setUserPreferences] = useState<UserJobPreferences>({
    gender: null,
    age: null,
    place: null,
    work_days: null,
    start_time: null,
    end_time: null,
    hourly_wage: null,
    category: null,
    requirements: null
  })
  
  // 검색 결과 관련 state
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'conditions' | 'results'>('conditions')
  
  // 모달 관련 state
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // 무한 스크롤 관련 state
  const [sessionId, setSessionId] = useState<string>('')
  const jobseekerId = userId
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesTopRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isScrollEnabled, setIsScrollEnabled] = useState(false)  // ✅ state로 변경
  const prevDbMessageCountRef = useRef(0)  // ✅ DB 메시지 개수 추적

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }) //smooth
  }

  // 일자리 조건 저장
  const saveConditionToDb = async (conditionData: UserJobPreferences) => {
    try {
      await fetch('/api/result-condition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conditionData
        })
      })
    } catch (error) {
      console.error('Failed to save condition:', error)
    }
  }

  // 일자리 조건 로드
  const loadConditionFromDb = async () => {
    try {
      const response = await fetch('/api/result-condition')
      const data = await response.json()
      if (data.success && data.data) {
        setUserPreferences(data.data.condition_data)
      }
    } catch (error) {
      console.error('Failed to load condition:', error)
    }
  }

  // 일자리 조건 삭제
  const deleteConditionFromDb = async () => {
    try {
      const response = await fetch('/api/result-condition', {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setUserPreferences({
          gender: null,
          age: null,
          place: null,
          work_days: null,
          start_time: null,
          end_time: null,
          hourly_wage: null,
          category: null,
          requirements: null
        })
      }
    } catch (error) {
      console.error('Failed to delete condition:', error)
      alert('조건 삭제에 실패했습니다.')
    }
  }

  const handleDeleteField = async (field: keyof UserJobPreferences | Array<keyof UserJobPreferences>) => {
    try {
      // 단일 필드 또는 여러 필드를 배열로 받아 처리
      const fieldsToDelete = Array.isArray(field) ? field : [field]
      
      // API로 업데이트된 조건 전송 (현재 상태 기반으로 업데이트)
      const updatedPreferences = { ...userPreferences }
      fieldsToDelete.forEach(f => {
        updatedPreferences[f] = null
      })
      
      const response = await fetch('/api/result-condition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conditionData: updatedPreferences }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update condition')
      }

      // API 성공 후 로컬 상태 업데이트
      setUserPreferences(updatedPreferences)
    } catch (error) {
      console.error('Failed to delete field:', error)
      alert('조건 삭제에 실패했습니다.')
    }
  }

  // 검색 결과 저장
  const saveSearchResultsToDb = async (results: any[]) => {
    try {
      const jobIds = results.map(job => job.id)
      await fetch('/api/result-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobIds
        })
      })
    } catch (error) {
      console.error('Failed to save search results:', error)
    }
  }

  // 검색 결과 로드
  const loadSearchResultsFromDb = async () => {
    try {
      const response = await fetch('/api/result-search')
      const data = await response.json()
      if (data.success && data.data) {
        setSearchResults(data.data)
      }
    } catch (error) {
      console.error('Failed to load search results:', error)
    }
  }

  // 검색 결과 삭제
  const deleteSearchResultsFromDb = async () => {
    try {
      const response = await fetch('/api/result-search', {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Failed to delete search results:', error)
      alert('검색 결과 삭제에 실패했습니다.')
    }
  }

  // 최초 마운트 시에만 실행 (빈 배열일 경우) : 클라이언트 마운트 후 초기화 
  useEffect(() => {
    setIsClient(true)
    
    // FastAPI 서버 URL 설정
    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    const serverUrl = hostname === 'localhost' 
      ? process.env.NEXT_PUBLIC_FASTAPI_LOCAL || 'http://localhost:8082'
      : process.env.NEXT_PUBLIC_FASTAPI_SERVER || 'https://albahero.com:545'
    setFastapiServer(serverUrl)
    
    // sessionId 생성 또는 로드
    let sid = localStorage.getItem('chatSessionId')
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('chatSessionId', sid)
    }
    setSessionId(sid)
  }, [])

  // sessionId 초기화 : 배열내 값이 변할 때만 실행
  useEffect(() => {
    if (isClient) {
      let sid = localStorage.getItem('chatSessionId')
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('chatSessionId', sid)
      }
      setSessionId(sid)
    }
  }, [isClient])
  
  // ✅ TanStack Query 무한 스크롤 데이터를 Zustand로 동기화 : 배열내 값이 변할 때만 실행
  useEffect(() => {
    // ✅ 로딩 중이면 실행하지 않음 (데이터가 완전히 로드될 때까지 대기)
    if (isLoadingHistory) {
      return
    }

    // ✅ DB에 메시지가 있는 경우
    if (infiniteChatData?.pages && infiniteChatData.pages.length > 0 && infiniteChatData.pages[0].messages.length > 0) {
      // 모든 페이지의 메시지를 하나로 합침
      const dbMessages = infiniteChatData.pages.flatMap((page, pageIndex) => 
        page.messages.map((msg: any, msgIndex: number) => ({
          id: `db_${msg.id}_${pageIndex}_${msgIndex}`,
          text: msg.message_text,
          sender: msg.sender,
          timestamp: new Date(msg.created_at)
        }))
      )
      
      // ✅ timestamp 기준으로 오래된 순 정렬 (채팅 UI는 위→아래로 시간 순)
      const sortedDbMessages = dbMessages.sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      )
      
      // ✅ DB 메시지 개수가 변경되지 않았으면 업데이트하지 않음 (무한 루프 방지)
      if (sortedDbMessages.length === prevDbMessageCountRef.current && prevDbMessageCountRef.current > 0) {
        return
      }
      
      prevDbMessageCountRef.current = sortedDbMessages.length
      
      // ✅ 클라이언트에서 추가한 메시지(아직 DB에 없는) 중 중복 제거
      // DB의 가장 최근 메시지보다 나중에 생성된 클라이언트 메시지만 유지
      const lastDbTimestamp = sortedDbMessages.length > 0 
        ? sortedDbMessages[sortedDbMessages.length - 1].timestamp.getTime() 
        : 0
      
      const currentMessages = useChatStore.getState().messages
      const clientMessages = currentMessages.filter(msg => {
        // 클라이언트 메시지만 필터링
        if (!(typeof msg.id === 'string' && msg.id.startsWith('msg_'))) {
          return false
        }
        // DB의 마지막 메시지보다 나중에 생성된 것만 유지
        return msg.timestamp.getTime() > lastDbTimestamp
      })
      
      // DB 메시지 + 클라이언트 메시지 병합
      setMessages([...sortedDbMessages, ...clientMessages])
      
      // ✅ 초기 로드 완료 표시 (첫 페이지 로드 후 500ms 대기)
      if (infiniteChatData.pages.length === 1 && !isScrollEnabled) {
        setTimeout(() => {
          setIsScrollEnabled(true)
        }, 500)
      }
    } 
    // ✅ DB에 메시지가 정말 없을 때만 환영 메시지 표시
    else if (infiniteChatData?.pages && infiniteChatData.pages.length === 1 && infiniteChatData.pages[0].messages.length === 0) {
      const currentMessages = useChatStore.getState().messages      
      if (currentMessages.length === 0 || currentMessages[0].id !== 'welcome') {
        const welcomeMessage: Message = {
          id: 'welcome',
          text: hi_msg,
          sender: 'bot',
          timestamp: new Date()
        }
        console.log("✅ 환영 메시지 설정:", welcomeMessage.text)
        setMessages([welcomeMessage])
        console.log("✅ setMessages 완료, 현재 messages:", useChatStore.getState().messages)
      }
      setIsScrollEnabled(true)
    }
  }, [infiniteChatData, isLoadingHistory])

  // 최초 마운트 시에만 실행 (빈 배열일 경우) : 최초 로드: 일자리 조건과 검색 결과 로드
  useEffect(() => {
    void loadConditionFromDb()
    void loadSearchResultsFromDb()
  }, [])

  // 무한 스크롤 IntersectionObserver 설정
  useEffect(() => {
    console.log('[IntersectionObserver] Check conditions:', {
      isScrollEnabled,
      hasMessagesTopRef: !!messagesTopRef.current,
      hasNextPage,
      messagesLength: messages.length
    })
    
    // ✅ 초기 로드가 완료되고, 메시지가 있고, 더 로드할 데이터가 있을 때만 활성화
    if (!isScrollEnabled || !messagesTopRef.current || !hasNextPage || messages.length === 0) {
      console.log('[IntersectionObserver] Not setting up observer - conditions not met')
      return
    }

    console.log('[IntersectionObserver] Setting up observer')

    const observer = new IntersectionObserver(
      (entries) => {
        console.log('[IntersectionObserver] Triggered:', entries[0].isIntersecting)
        if (entries[0].isIntersecting && !isFetchingNextPage && hasNextPage) {
          console.log('[IntersectionObserver] Fetching next page')
          const container = messagesContainerRef.current
          if (!container) return
          
          const prevScrollHeight = container.scrollHeight
          const prevScrollTop = container.scrollTop
          
          console.log('[IntersectionObserver] Before fetch - scrollHeight:', prevScrollHeight, 'scrollTop:', prevScrollTop)
          
          fetchNextPage().then(() => {
            // ✅ 스크롤 위치 복원: 새로 추가된 높이만큼 스크롤 이동
            // requestAnimationFrame을 2번 연속 사용하여 DOM 렌더링 완료 보장
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (container) {
                  const newScrollHeight = container.scrollHeight
                  const addedHeight = newScrollHeight - prevScrollHeight
                  container.scrollTop = prevScrollTop + addedHeight
                  
                  console.log('[IntersectionObserver] After fetch - scrollHeight:', newScrollHeight, 'scrollTop:', container.scrollTop, 'added:', addedHeight)
                }
              })
            })
          })
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(messagesTopRef.current)

    return () => observer.disconnect()
  }, [isScrollEnabled, hasNextPage, isFetchingNextPage, messages.length, fetchNextPage])

  // textarea 자동 높이 조절 : 배열내 값이 변할 때만 실행
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '60px'  // 리셋
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = scrollHeight + 'px'  // CSS maxHeight가 자동으로 제한
    }
  }, [inputText])

  useEffect(() => { //배열내 값이 변할 때만 실행
    scrollToBottom()
  }, [messages])

  // 대화 내역은 DB에 저장되므로 localStorage 저장 불필요

  // 임베딩 처리 상태
  const [isProcessing1536Embeddings, setIsProcessing1536Embeddings] = useState(false)
  const [isProcessing768Embeddings, setIsProcessing768Embeddings] = useState(false)
  
  // 유사도 임계값 (0.1 ~ 0.5)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.3)

  // 1536 임베딩 처리 핸들러
  const handle1536Embeddings = async () => {
    // if (!confirm('embedding이 비어있는 모든 일자리 정보를 처리하시겠습니까?\n\n⚠️ 처리 시간이 오래 걸릴 수 있습니다.\n(100개 레코드 기준 약 5-10분 소요)')) {
    //   return
    // }
    if (!confirm('embedding 1536 batch.. continue?')) {
      return
    }

    setIsProcessing1536Embeddings(true)

    try {
      const response = await fetch(fastapiServer + '/admin/update_embeddings1536', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        const message = `✅ 1536차원 임베딩 처리 완료!\n\n` +
          `• 총 처리: ${result.total}개\n` +
          `• 성공: ${result.updated}개\n` +
          `• 실패: ${result.failed}개\n` +
          `• 소요 시간: ${(result.duration / 1000).toFixed(1)}초`
        
        alert(message)
        
        if (result.failed_ids && result.failed_ids.length > 0) {
          console.error('[1536 Embedding] 실패한 Job IDs:', result.failed_ids)
        }
      } else {
        alert(`❌ 오류 발생:\n\n${result.error}`)
        console.error('[1536 Embeddings Error]:', result)
      }
    } catch (error: any) {
      console.error('[1536 Embeddings] Network error:', error)
      alert(`❌ 네트워크 오류:\n\n${error.message}`)
    } finally {
      setIsProcessing1536Embeddings(false)
    }
  }

  // 768 임베딩 처리 핸들러
  const handle768Embeddings = async () => {
    if (!confirm('embedding 768 batch.. continue?')) {
      return
    }

    setIsProcessing768Embeddings(true)

    try {
      const response = await fetch(fastapiServer + '/admin/update_embeddings768', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        const message = `✅ 768차원 임베딩 처리 완료!\n\n` +
          `• 총 처리: ${result.total}개\n` +
          `• 성공: ${result.updated}개\n` +
          `• 실패: ${result.failed}개`
        
        alert(message)
        
        if (result.failed_ids && result.failed_ids.length > 0) {
          console.error('[768 Embedding] 실패한 Job IDs:', result.failed_ids)
        }
      } else {
        alert(`❌ 오류 발생:\n\n${result.message || '알 수 없는 오류'}`)
        console.error('[768 Embedding Error]:', result)
      }
    } catch (error: any) {
      console.error('[768 Embedding] Network error:', error)
      alert(`❌ 네트워크 오류:\n\n${error.message}`)
    } finally {
      setIsProcessing768Embeddings(false)
    }
  }

  // 대화 내역 삭제 (새 세션 시작)
  const clearHistory = () => {
    if (!confirm('채팅 내역을 모두 삭제하시겠습니까?')) {
      return
    }

    // ✅ TanStack Query mutation으로 삭제
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        // 새 세션 생성
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('chatSessionId', newSessionId)
        setSessionId(newSessionId)
        
        // Zustand store 초기화
        clearMessages()
        
        const initialMessage = {
          id: generateUniqueId(),
          text: hi_msg,
          sender: 'bot' as const,
          timestamp: new Date()
        }
        addMessage(initialMessage)
      }
    })
  }

  const copyToInput = (text: string) => {
    setInputText(text)
    // 입력창에 포커스
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleSend = async (isSearch: boolean = false, includeRequirements: boolean = false) => {
    // 검색 모드가 아니면 inputText 필수
    if (!isSearch && !inputText.trim()) return

    const sendText = isSearch ? (
      includeRequirements ? '일반+추가조건 검색' : '일반 검색'
    ) : inputText
    const userMessage: Message = {
      id: generateUniqueId(),
      text: sendText,
      sender: 'user',
      timestamp: new Date()
    }

    addMessage(userMessage)
    const currentInput = sendText
    setInputText('')
    
    // DB에 사용자 메시지 저장
    saveMutation.mutate(
      { messageText: currentInput, sender: 'user', sessionId },
      {
        onError: (error) => {
          console.error('[handleSend] Failed to save user message:', error)
        }
      }
    )

    setIsTyping(true)
    
    // 검색 모드일 때 검색 결과 탭으로, 아니면 조건 탭으로 전환
    if (isSearch) {
      setIsSearching(true)
      setActiveTab('results')
    } else {
      setActiveTab('conditions')
    }
    
    try {
      const route = fastapiServer + "/chat"
      console.log('[handleSend] Calling FastAPI:', {
        route,
        isSearch,
        includeRequirements,
        text: currentInput,
        condition: userPreferences
      })
      
      // requirements: 검색(일반)일 때는 제외
      const conditionToSend = isSearch && !includeRequirements 
        ? { ...userPreferences, requirements: null }
        : userPreferences
      
      // 검색(일반)일 때는 embeddingModel, similarityThreshold 제외
      // 검색(일반+추가조건)일 때만 포함
      const requestBody: any = {
        text: currentInput,
        condition: conditionToSend,
        search: isSearch,
      }
      
      // 하이브리드 검색(일반+추가조건)일 때만 임베딩 파라미터 추가
      if (isSearch && includeRequirements) {
        requestBody.embeddingModel = 'jhgan'
        requestBody.similarityThreshold = similarityThreshold
      }
      
      const response = await fetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        setIsTyping(false)
        setIsSearching(false)
        throw new Error(data.error || '오류가 발생했습니다.')
      }

      if (data.code != "0") {
        setIsTyping(false)
        setIsSearching(false)
        throw new Error('오류가 발생했습니다: ' + data.msg)
      }

      const rs = data.rs //data.code 있으면 data.rs는 무조건 있다고 보기    

      // 조건 업데이트 (조건이 있으면 병합)
      if (rs.condition) {
        const mergedCondition: UserJobPreferences = {
          gender: rs.condition.gender ?? userPreferences.gender,
          age: rs.condition.age ?? userPreferences.age,
          place: rs.condition.place ?? userPreferences.place,
          work_days: rs.condition.work_days ?? userPreferences.work_days,
          start_time: rs.condition.start_time ?? userPreferences.start_time,
          end_time: rs.condition.end_time ?? userPreferences.end_time,
          hourly_wage: rs.condition.hourly_wage ?? userPreferences.hourly_wage,
          category: rs.condition.category ?? userPreferences.category,
          requirements: rs.condition.requirements ?? userPreferences.requirements,
        }
        setUserPreferences(mergedCondition)
        await saveConditionToDb(mergedCondition)
      }

      // 검색 결과가 있으면 업데이트
      if (rs.result && rs.result.length > 0) {
        setSearchResults(rs.result)
        await saveSearchResultsToDb(rs.result)
      }
      setIsSearching(false)

      // 봇 응답 메시지 (API에서 생성된 메시지 사용)
      //const botResponseText = data.response || '처리되었습니다.'
      const botResponseText = rs.reply || '처리되었습니다.'
      const botMessage: Message = {
        id: generateUniqueId(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      }
      addMessage(botMessage)
      setIsTyping(false)
      
      // DB에 봇 메시지 저장 (UI는 이미 addMessage로 추가됨)
      saveMutation.mutate(
        { messageText: botResponseText, sender: 'bot', sessionId },
        {
          onError: (error) => {
            console.error('[handleSend] Failed to save bot message:', error)
          }
        }
      )
    } catch (error) {
      console.error('[handleSend] Error:', error)
      setIsTyping(false)
      setIsSearching(false)
      
      const errorMessage: Message = {
        id: generateUniqueId(),
        text: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
        sender: 'bot',
        timestamp: new Date()
      }
      addMessage(errorMessage)
      
      // DB에 에러 메시지 저장 (UI는 이미 addMessage로 추가됨)
      saveMutation.mutate(
        { messageText: errorMessage.text, sender: 'bot', sessionId },
        {
          onError: (error) => {
            console.error('[handleSend] Failed to save error message:', error)
          }
        }
      )
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(false, false) // 전송 버튼과 동일한 동작
    }
  }

  const handleResetPreferences = () => {
    setUserPreferences({
      gender: null,
      age: null,
      place: null,
      work_days: null,
      start_time: null,
      end_time: null,
      hourly_wage: null,
      category: null,
      requirements: null
    })
  }

  const handleJobClick = (jobId: number) => {
    setSelectedJobId(jobId)
    setShowModal(true)
  }

  return (
    <div className="flex flex-col h-full p-6 gap-5">
      {/* 상단 영역: 채팅 + 조건 카드 */}
      <div className="flex gap-5 h-full overflow-hidden">
        {/* 좌측 채팅 영역 */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* 헤더 */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">AI 챗봇 일자리 검색</h1>
              <p className="text-gray-600 text-sm">
                원하시는 조건을 자유롭게 말씀해주세요
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* 유사도 게이지 */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                <span className="text-sm text-gray-600 font-medium">유사도:</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-sm font-bold text-blue-600 w-10">{similarityThreshold.toFixed(2)}</span>
              </div>
              
              {/* 768 임베딩 처리 버튼 */}
              <button
                onClick={handle768Embeddings}
                disabled={isProcessing768Embeddings}
                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isProcessing768Embeddings
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-green-400 hover:text-green-400'
                }`}
                title="768차원 embedding 처리 (FastAPI)"
              >
                {isProcessing768Embeddings ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                    처리 중...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    768
                  </>
                )}
              </button>
              
              {/* 1536 임베딩 처리 버튼 */}
              <button
                onClick={handle1536Embeddings}
                disabled={isProcessing1536Embeddings}
                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isProcessing1536Embeddings
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-400'
                }`}
                title="embedding이 비어있는 레코드를 처리합니다"
              >
                {isProcessing1536Embeddings ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                    처리 중...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    1536
                  </>
                )}
              </button>
              
              {/* 대화 내역 삭제 버튼 */}
              <button
                onClick={clearHistory}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-50 hover:border-red-400 hover:text-red-400 transition-all flex items-center gap-2 text-sm"
              >
                <Trash2 size={16} />
                대화 내역 삭제
              </button>
            </div>
          </div>

          {/* 채팅 영역 */}
          <div className="flex-1 flex flex-col bg-gray-100 rounded-xl border border-gray-300 overflow-hidden">
            {/* 메시지 영역 */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {/* 초기 로딩 인디케이터 */}
              {isLoadingHistory && (
                <div className="flex items-center justify-center h-full">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}

              {/* 에러 발생 시 */}
              {isChatHistoryError && (
                <div className="flex items-center justify-center h-full">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                    <div className="text-4xl mb-3">⚠️</div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      채팅 내역을 불러올 수 없습니다
                    </h3>
                    <p className="text-sm text-red-600 mb-4">
                      {chatHistoryError instanceof Error ? chatHistoryError.message : '알 수 없는 오류가 발생했습니다'}
                    </p>
                    <button
                      onClick={() => refetchChatHistory()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              )}

              {/* 무한 스크롤 감지 요소 */}
              {!isLoadingHistory && !isChatHistoryError && <div ref={messagesTopRef} className="h-1" />}
              
              {/* 이전 메시지 로딩 인디케이터 */}
              {isFetchingNextPage && (
                <div className="text-center text-sm text-gray-500 py-2">
                  이전 메시지를 불러오는 중...
                </div>
              )}
              
              {!isLoadingHistory && !isChatHistoryError && messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Bot size={20} color="#ffffff" />
                    </div>
                  )}

                  <div className="max-w-[70%] flex flex-col gap-2">
                    <div
                      className={`px-4 py-3 rounded-xl ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 shadow-sm'
                      } whitespace-pre-wrap break-words`}
                    >
                      {message.text}
                    </div>
                    {isClient && (
                      <div className="flex items-center gap-2 px-1">
                        <div className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {message.sender === 'user' && (
                          <button
                            onClick={() => copyToInput(message.text)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="입력창에 복사"
                          >
                            <Copy size={12} className="text-gray-500" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {message.sender === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <User size={20} color="#666" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Bot size={20} color="#ffffff" />
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white border border-gray-300 shadow-sm flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="p-4 border-t border-gray-300 bg-white">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요 (Enter: 전송 / Shift+Enter: 줄바꿈)"
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-base resize-none focus:outline-none focus:border-blue-500 overflow-y-auto"
                  style={{ minHeight: '60px', maxHeight: '200px' }}
                />
                <button
                  onClick={() => handleSend(false, false)}
                  className="px-6 py-3 rounded-lg flex items-center gap-2 text-base font-medium transition-all bg-blue-500 text-white hover:bg-blue-600 cursor-pointer whitespace-nowrap"
                >
                  <Send size={20} />
                  전송
                </button>
              </div>
            </div>
          </div>

          {/* 빠른 질문 버튼들 - 나중을 위해 숨김 */}
          <div className="hidden flex-wrap gap-2">
            {['강남에서 주 5일 서빙 일자리', '시급 2만원 이상 카페', '주말만 가능한 배달', '일자리 추천 받기'].map((quickQuestion) => (
              <button
                key={quickQuestion}
                onClick={() => {
                  setInputText(quickQuestion)
                  setTimeout(() => handleSend(), 100)
                }}
                className="px-4 py-2 border border-blue-500 rounded-full bg-transparent text-blue-500 hover:bg-blue-50 transition-all text-sm"
              >
                {quickQuestion}
              </button>
            ))}
          </div>
        </div>

        {/* 우측 탭 패널 */}
        <div className="w-[350px] flex-shrink-0 flex flex-col">
          {/* 탭 헤더 */}
          <div className="flex border-b border-gray-300 mb-4">
            <button
              onClick={() => setActiveTab('conditions')}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === 'conditions'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              일자리 조건
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                activeTab === 'results'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              검색 결과
              {searchResults.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {searchResults.length}
                </span>
              )}
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="flex-1 min-h-0">
            {activeTab === 'conditions' ? (
              <JobPreferencesCard 
                preferences={userPreferences}
                onReset={handleResetPreferences}
                onDelete={deleteConditionFromDb}
                onSearch={(includeRequirements) => {
                  handleSend(true, includeRequirements)
                }}
                onDeleteField={handleDeleteField}
              />
            ) : (
              <SearchResultsCard 
                results={searchResults}
                isLoading={isSearching}
                onJobClick={handleJobClick}
                onDelete={deleteSearchResultsFromDb}
              />
            )}
          </div>
        </div>
      </div>

      {/* 일자리 상세 모달 */}
      {showModal && selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          jobIds={searchResults.map(job => job.id)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
