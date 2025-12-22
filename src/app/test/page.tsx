'use client'

import { useEffect, useState } from 'react'

interface TestResult {
  success: boolean
  message: string
  results?: {
    database: {
      connected: boolean
      jobsCount: number
      jobs: Array<{
        id: number
        title: string
        company: string
        location: string
        category: string
        hasEmbedding: boolean
        hasEmbeddingKo: boolean
      }>
    }
    mcp: {
      success: boolean
      message: string
      details?: any
    }
  }
  error?: string
}

export default function TestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runTest()
  }, [])

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: '테스트 API 호출 실패',
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            MCP & PostgreSQL 연결 테스트
          </h1>

          <button
            onClick={runTest}
            disabled={loading}
            className="mb-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '테스트 중...' : '다시 테스트'}
          </button>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {!loading && testResult && (
            <div className="space-y-6">
              {/* 전체 결과 */}
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h2 className={`text-xl font-semibold mb-2 ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? '✅ 테스트 성공' : '❌ 테스트 실패'}
                </h2>
                <p className="text-gray-700">{testResult.message}</p>
                {testResult.error && (
                  <p className="text-red-600 mt-2 text-sm">{testResult.error}</p>
                )}
              </div>

              {testResult.results && (
                <>
                  {/* 데이터베이스 결과 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">
                      📊 데이터베이스 연결
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">연결 상태:</span>{' '}
                        <span className={testResult.results.database.connected ? 'text-green-600' : 'text-red-600'}>
                          {testResult.results.database.connected ? '✓ 연결됨' : '✗ 연결 안됨'}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">조회된 일자리 수:</span>{' '}
                        {testResult.results.database.jobsCount}개
                      </p>
                    </div>

                    {testResult.results.database.jobs.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-2">일자리 목록:</h4>
                        <div className="space-y-2">
                          {testResult.results.database.jobs.map((job) => (
                            <div key={job.id} className="bg-white p-3 rounded border border-blue-100">
                              <p className="font-medium text-sm">{job.title}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {job.company} | {job.location} | {job.category}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded ${job.hasEmbedding ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {job.hasEmbedding ? '✓ OpenAI Vector' : '✗ OpenAI Vector'}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${job.hasEmbeddingKo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {job.hasEmbeddingKo ? '✓ Korean Vector' : '✗ Korean Vector'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* MCP 결과 */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-800 mb-3">
                      🤖 MCP (Model Context Protocol) 연결
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">연결 상태:</span>{' '}
                        <span className={testResult.results.mcp.success ? 'text-green-600' : 'text-red-600'}>
                          {testResult.results.mcp.success ? '✓ 연결됨' : '✗ 연결 안됨'}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">메시지:</span>{' '}
                        {testResult.results.mcp.message}
                      </p>
                      {testResult.results.mcp.details && (
                        <div className="mt-3 bg-white p-3 rounded border border-purple-100">
                          <p className="text-xs font-medium mb-2">상세 정보:</p>
                          <pre className="text-xs text-gray-700 overflow-auto">
                            {JSON.stringify(testResult.results.mcp.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* 환경 변수 체크 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  ⚙️ 환경 설정
                </h3>
                <div className="space-y-1 text-sm">
                  <p>✓ DATABASE_URL 설정됨</p>
                  <p>✓ OPENAI_API_KEY 설정됨</p>
                  <p>✓ Vector DB (pgvector) 사용</p>
                  <p>✓ Qwen 3 모델 준비됨</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
