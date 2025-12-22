'use client'

import { Briefcase, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Job {
  id: number
  company?: string | null
  title?: string
  description?: string | null
  location?: string | null
  hourly_wage?: number | null
  status?: string
  similarity?: number  // 벡터 검색 유사도 (0~1)
}

interface Application {
  id: number
  job_id: number
  jobseeker_id: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  applied_date: Date
}

interface SearchResultsCardProps {
  results: Job[]
  isLoading?: boolean
  onJobClick?: (jobId: number) => void
  onDelete?: () => void
}

export default function SearchResultsCard({ results, isLoading, onJobClick, onDelete }: SearchResultsCardProps) {
  const [applications, setApplications] = useState<Map<number, Application>>(new Map())
  const jobseekerId = 1 // 실제로는 로그인된 구직자 ID 사용

  // 모든 일자리의 지원 상태 확인
  useEffect(() => {
    const fetchApplications = async () => {
      if (results.length === 0) return

      const appMap = new Map<number, Application>()
      
      // 모든 일자리에 대해 지원 상태 확인
      await Promise.all(
        results.map(async (job) => {
          try {
            const response = await fetch(`/api/applications?jobId=${job.id}&jobseekerId=${jobseekerId}`)
            const data = await response.json()
            
            if (response.ok && data.application) {
              appMap.set(job.id, data.application)
            }
          } catch (error) {
            console.error(`Error checking application for job ${job.id}:`, error)
          }
        })
      )
      
      setApplications(appMap)
    }

    fetchApplications()
  }, [results])

  // 지원 상태 배지 렌더링
  const getApplicationBadge = (jobId: number) => {
    const application = applications.get(jobId)
    if (!application) return null

    const statusConfig = {
      PENDING: {
        icon: <AlertCircle size={14} />,
        text: '검토 중',
        className: 'bg-yellow-100 text-yellow-700'
      },
      ACCEPTED: {
        icon: <CheckCircle size={14} />,
        text: '합격',
        className: 'bg-green-100 text-green-700'
      },
      REJECTED: {
        icon: <XCircle size={14} />,
        text: '불합격',
        className: 'bg-red-100 text-red-600'
      }
    }

    const config = statusConfig[application.status]

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        {config.text}
      </div>
    )
  }
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-300 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">검색 중...</p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden h-full flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">
              검색 결과 <span className="text-blue-500">(0)</span>
            </h2>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all opacity-0 pointer-events-none"
                title="검색 결과 삭제"
              >
                <Trash2 size={18} className="text-red-500" />
              </button>
            )}
          </div>
        </div>
        
        {/* 빈 상태 */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">검색 결과가 없습니다</p>
            <p className="text-sm">다른 조건으로 검색해보세요</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden h-full flex flex-col">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            검색 결과 <span className="text-blue-500">({results.length})</span>
          </h2>
          {onDelete && results.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              title="검색 결과 삭제"
            >
              <Trash2 size={18} className="text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* 결과 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {results.map((job, index) => (
          <div
            key={job.id || index}
            onClick={() => onJobClick?.(job.id)}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white"
          >
            {/* 회사명 & 타이틀 */}
            <div className="mb-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-base leading-tight flex-1">
                  {job.title || '제목 없음'}
                </h3>
                {getApplicationBadge(job.id)}
              </div>
              {job.company && (
                <p className="text-sm text-gray-600 font-medium">{job.company}</p>
              )}
            </div>

            {/* 공고 내용 */}
            {job.description && (
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                {job.description.length > 50 
                  ? `${job.description.substring(0, 50)}...` 
                  : job.description}
              </p>
            )}

            {/* 조건 정보 */}
            <div className="space-y-2">
              {job.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <span>{job.location}</span>
                </div>
              )}
              
              {job.hourly_wage && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-blue-600">
                    시급 {job.hourly_wage.toLocaleString()}원
                  </span>
                  {job.similarity !== undefined && (
                    <span className="text-xs text-gray-500 ml-2">
                      (유사도: {(job.similarity * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
