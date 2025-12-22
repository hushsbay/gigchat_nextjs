import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'

interface ChatMessage {
  id: number
  message_text: string
  sender: 'user' | 'bot'
  created_at: string
}

interface ChatHistoryResponse {
  success: boolean
  messages: ChatMessage[]
  hasMore: boolean
}

// 채팅 히스토리 조회 (단일 페이지)
export function useChatHistory(offset: number = 0, enabled: boolean = true) {
  return useQuery({
    queryKey: ['chatHistory', offset],
    queryFn: async () => {
      const response = await fetch(`/api/chat-history?limit=20&offset=${offset}`)
      if (!response.ok) throw new Error('Failed to fetch chat history')
      return response.json() as Promise<ChatHistoryResponse>
    },
    enabled,
  })
}

// 무한 스크롤용 채팅 히스토리 조회
export function useInfiniteChatHistory(enabled: boolean = true) {
  return useInfiniteQuery({
    queryKey: ['chatHistory', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('[useInfiniteChatHistory] Fetching page:', pageParam)
      const response = await fetch(`/api/chat-history?limit=20&offset=${pageParam}`)
      if (!response.ok) {
        // ✅ 상세한 에러 정보 포함
        throw new Error(`Failed to fetch chat history (status: ${response.status}, offset: ${pageParam})`)
      }
      const data = await response.json() as ChatHistoryResponse
      console.log('[useInfiniteChatHistory] Response:', {
        messagesCount: data.messages.length,
        hasMore: data.hasMore,
        pageParam
      })
      return data
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextParam = lastPage.hasMore ? allPages.length * 20 : undefined
      console.log('[useInfiniteChatHistory] getNextPageParam:', {
        hasMore: lastPage.hasMore,
        nextParam,
        totalPages: allPages.length
      })
      return nextParam
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // ✅ 5분간 캐시 유지 (중복 요청 방지)
    gcTime: 10 * 60 * 1000, // ✅ 10분간 메모리 유지
    refetchOnMount: false, // ✅ 마운트 시 자동 refetch 비활성화
    refetchOnWindowFocus: false, // ✅ 윈도우 포커스 시 refetch 비활성화
    enabled, // ✅ 외부에서 제어 가능
  })
}

// 채팅 메시지 저장
export function useSaveChatMessage() {
  return useMutation({
    mutationFn: async ({ messageText, sender, sessionId }: { 
      messageText: string
      sender: 'user' | 'bot'
      sessionId: string 
    }) => {
      const response = await fetch('/api/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText, sender, sessionId })
      })
      if (!response.ok) throw new Error('Failed to save message')
      return response.json()
    },
    // ✅ onSuccess 제거: 수동으로 refetch 제어
  })
}

// 채팅 내역 삭제
export function useDeleteChatHistory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/chat-history', { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete chat history')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] })
    }
  })
}
