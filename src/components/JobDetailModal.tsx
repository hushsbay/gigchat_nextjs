'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, MapPin, DollarSign, Calendar, Clock, Briefcase, User, GraduationCap, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { Job, Application } from '@/lib/db'

interface JobDetailModalProps {
  jobId: number
  jobIds: number[] // 전체 검색 결과의 ID 목록
  onClose: () => void
}

export default function JobDetailModal({ jobId, jobIds, onClose }: JobDetailModalProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<Application | null>(null)
  const [applying, setApplying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(jobIds.indexOf(jobId))
  const jobseekerId = 1 // 실제로는 로그인된 구직자 ID 사용

  // 일자리 상세 정보 로드
  const loadJobDetail = async (id: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/${id}`)
      const data = await response.json()
      
      if (response.ok) {
        setJob(data.job)
        checkApplicationStatus(id)
      } else {
        console.error('Failed to load job:', data.error)
      }
    } catch (error) {
      console.error('Error loading job:', error)
    } finally {
      setLoading(false)
    }
  }

  // 지원 여부 및 현황 확인
  const checkApplicationStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/applications?jobId=${id}&jobseekerId=${jobseekerId}`)
      const data = await response.json()
      
      if (response.ok) {
        setApplication(data.application)
      }
    } catch (error) {
      console.error('Error checking application:', error)
    }
  }

  // 지원하기
  const handleApply = async () => {
    if (!job) return
    
    setApplying(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, jobseekerId })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setApplication(data.application)
        alert('지원이 완료되었습니다!')
      } else {
        alert(data.error || '지원 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Error applying:', error)
      alert('지원 중 오류가 발생했습니다.')
    } finally {
      setApplying(false)
    }
  }

  // 지원 취소
  const handleCancelApplication = async () => {
    if (!job) return
    
    if (!confirm('지원을 취소하시겠습니까?')) return
    
    setApplying(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, jobseekerId })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setApplication(null)
        alert('지원이 취소되었습니다.')
      } else {
        alert(data.error || '지원 취소 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Error canceling application:', error)
      alert('지원 취소 중 오류가 발생했습니다.')
    } finally {
      setApplying(false)
    }
  }

  // 지원 상태 표시 함수
  const getApplicationStatusBadge = () => {
    if (!application) return null

    const statusConfig = {
      PENDING: {
        icon: <AlertCircle size={16} />,
        text: '검토 중',
        className: 'bg-yellow-100 text-yellow-700'
      },
      ACCEPTED: {
        icon: <CheckCircle size={16} />,
        text: '합격',
        className: 'bg-green-100 text-green-700'
      },
      REJECTED: {
        icon: <XCircle size={16} />,
        text: '불합격',
        className: 'bg-red-100 text-red-600'
      }
    }

    const config = statusConfig[application.status]

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.icon}
        {config.text}
      </div>
    )
  }

  // 이전 일자리
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      loadJobDetail(jobIds[newIndex])
    }
  }

  // 다음 일자리
  const handleNext = () => {
    if (currentIndex < jobIds.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      loadJobDetail(jobIds[newIndex])
    }
  }

  // 초기 로드
  useEffect(() => {
    loadJobDetail(jobId)
  }, [jobId])

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // 마감 여부 확인
  const isDeadlinePassed = job?.deadline ? new Date(job.deadline) < new Date() : false
  const isClosed = job?.status === 'CLOSED' || isDeadlinePassed

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              일자리 상세 ({currentIndex + 1} / {jobIds.length})
            </h2>
            <button
              onClick={handleNext}
              disabled={currentIndex === jobIds.length - 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : job ? (
            <div className="space-y-6">
              {/* 제목 및 회사 */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h3>
                {job.company && (
                  <p className="text-lg text-gray-600">{job.company}</p>
                )}
                <div className="flex gap-2 mt-3">
                  {isClosed && (
                    <div className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                      마감됨
                    </div>
                  )}
                  {getApplicationStatusBadge()}
                </div>
              </div>

              {/* 주요 정보 */}
              <div className="grid grid-cols-2 gap-4">
                {job.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">근무지</p>
                      <p className="text-gray-900 font-medium">{job.location}</p>
                    </div>
                  </div>
                )}

                {(job.salary || job.salary_type) && (
                  <div className="flex items-start gap-3">
                    <DollarSign size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">급여</p>
                      <p className="text-gray-900 font-medium">
                        {job.salary_type === 'hourly' && job.salary
                          ? `시급 ${parseInt(job.salary).toLocaleString()}원`
                          : job.salary || '-'}
                      </p>
                    </div>
                  </div>
                )}

                {job.work_days && (
                  <div className="flex items-start gap-3">
                    <Calendar size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">근무일</p>
                      <p className="text-gray-900 font-medium">{job.work_days}</p>
                    </div>
                  </div>
                )}

                {job.work_hours && (
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">근무시간</p>
                      <p className="text-gray-900 font-medium">{job.work_hours}</p>
                    </div>
                  </div>
                )}

                {job.job_type && (
                  <div className="flex items-start gap-3">
                    <Briefcase size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">고용형태</p>
                      <p className="text-gray-900 font-medium">{job.job_type}</p>
                    </div>
                  </div>
                )}

                {job.category && (
                  <div className="flex items-start gap-3">
                    <Briefcase size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">직종</p>
                      <p className="text-gray-900 font-medium">{job.category}</p>
                    </div>
                  </div>
                )}

                {job.gender && (
                  <div className="flex items-start gap-3">
                    <User size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">성별</p>
                      <p className="text-gray-900 font-medium">{job.gender}</p>
                    </div>
                  </div>
                )}

                {job.age && (
                  <div className="flex items-start gap-3">
                    <User size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">연령</p>
                      <p className="text-gray-900 font-medium">{job.age}</p>
                    </div>
                  </div>
                )}

                {job.education && (
                  <div className="flex items-start gap-3">
                    <GraduationCap size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">학력</p>
                      <p className="text-gray-900 font-medium">{job.education}</p>
                    </div>
                  </div>
                )}

                {job.deadline && (
                  <div className="flex items-start gap-3">
                    <Calendar size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">마감일</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(job.deadline).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 구분선 */}
              <hr className="border-gray-200" />

              {/* 상세 설명 */}
              {job.description && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">상세 내용</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </p>
                </div>
              )}

              {/* 자격요건 */}
              {job.qualifications && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">자격요건</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.qualifications}
                  </p>
                </div>
              )}

              {/* 우대사항 */}
              {job.requirements && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">우대사항</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.requirements}
                  </p>
                </div>
              )}

              {/* 기타사항 */}
              {job.other_requirement && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">기타사항</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.other_requirement}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">일자리 정보를 불러올 수 없습니다.</p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {application && (
              <div className="text-sm text-gray-600">
                지원일: {new Date(application.applied_date).toLocaleDateString('ko-KR')}
              </div>
            )}
            {isClosed && (
              <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                마감
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            {application ? (
              <>
                {application.status === 'PENDING' && (
                  <button
                    onClick={handleCancelApplication}
                    disabled={applying}
                    className="px-6 py-2.5 border border-red-500 rounded-lg text-red-500 font-medium hover:bg-red-50 disabled:opacity-50 transition-all"
                  >
                    {applying ? '처리 중...' : '지원 취소'}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying || isClosed}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {applying ? '처리 중...' : isClosed ? '마감됨' : '지원하기'}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
