import { NextResponse } from 'next/server'
import { testConnection, getAllJobs } from '@/lib/db'
import { testMCPConnection } from '@/lib/mcp-client'

export async function GET() {
  try {
    console.log('=== 테스트 시작 ===')
    
    // 1. 데이터베이스 연결 테스트
    console.log('1. 데이터베이스 연결 테스트 중...')
    const dbConnected = await testConnection()
    
    if (!dbConnected) {
      return NextResponse.json({
        success: false,
        message: '데이터베이스 연결 실패',
      }, { status: 500 })
    }
    
    // 2. 전체 일자리 데이터 조회
    console.log('2. 일자리 데이터 조회 중...')
    const jobs = await getAllJobs(5) // 최대 5개만 조회
    
    // 3. MCP 연결 테스트
    console.log('3. MCP 연결 테스트 중...')
    const mcpTest = await testMCPConnection()
    
    console.log('=== 테스트 완료 ===')
    
    return NextResponse.json({
      success: true,
      message: '모든 테스트 성공',
      results: {
        database: {
          connected: dbConnected,
          jobsCount: jobs.length,
          jobs: jobs.map(job => ({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            category: job.category,
            hasEmbedding: !!job.embedding,
            hasEmbeddingKo: !!job.embedding_ko,
          }))
        },
        mcp: mcpTest
      }
    })
    
  } catch (error) {
    console.error('테스트 중 오류:', error)
    
    return NextResponse.json({
      success: false,
      message: '테스트 실패',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
