import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getEmbedding } from '@/lib/mcp-client'

/**
 * POST /api/admin/process-embeddings
 * embedding이 NULL인 jobs 레코드의 description을 임베딩 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const pool = getPool()
    
    console.log('[Embedding Process] Starting...')
    
    // 1. embedding이 NULL인 레코드 조회 AND status = 'ACTIVE'
    const { rows: jobsToProcess } = await pool.query(`
      SELECT *
      FROM jobs
      WHERE embedding_ko IS NULL        
      ORDER BY id
      LIMIT 100
    `)

    console.log(`[Embedding Process] Found ${jobsToProcess.length} jobs to process`)

    if (jobsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: '처리할 레코드가 없습니다. 모든 일자리 정보에 임베딩이 완료되었습니다.',
        processed: 0,
        failed: 0,
        duration: Date.now() - startTime
      })
    }

    let processed = 0
    let failed = 0
    const errors: { id: number; title: string; error: string }[] = []
    const processedJobs: { id: number; title: string }[] = []

    // 2. 각 레코드에 대해 임베딩 처리
    for (const job of jobsToProcess) {
      try {
        console.log(`[Embedding] Processing job ${job.id}: ${job.title}`)
        
        // 임베딩할 텍스트 조합 (updateall.py와 동일한 방식)
        const textParts: string[] = []
        
        if (job.title) textParts.push(`제목: ${job.title}`)
        if (job.description) textParts.push(`설명: ${job.description}`)
        if (job.requirements) textParts.push(`요구사항: ${job.requirements}`)
        if (job.location) textParts.push(`위치: ${job.location}`)
        if (job.category) textParts.push(`카테고리: ${job.category}`)
        if (job.qualifications) textParts.push(`자격: ${job.qualifications}`)
        if (job.company) textParts.push(`회사: ${job.company}`)
        if (job.age) textParts.push(`나이: ${job.age}`)
        if (job.gender) textParts.push(`성별: ${job.gender}`)
        if (job.other_requirement) textParts.push(`기타조건: ${job.other_requirement}`)
        
        if (textParts.length === 0) {
          throw new Error('임베딩할 텍스트가 없습니다.')
        }
        
        const combinedText = textParts.join('\n')
        console.log(`[Embedding] Combined text length: ${combinedText.length} characters`)
        
        // 텍스트를 임베딩으로 변환 (text-embedding-3-small: 1536 dimensions)
        const embeddingStartTime = Date.now()
        const embedding = await getEmbedding(combinedText)
        const embeddingDuration = Date.now() - embeddingStartTime
        
        console.log(`[Embedding] Generated embedding in ${embeddingDuration}ms`)
        
        // 차원 확인 (1536이어야 함)
        if (embedding.length !== 1536) {
          throw new Error(`Wrong embedding dimension: ${embedding.length}, expected 1536`)
        }

        console.log(`[Embedding] Generated embedding with ${embedding.length} dimensions`)

        // DB에 업데이트 (embedding_ko => 1536차원 / embedding => 768차원)
        const updateStartTime = Date.now()
        await pool.query(
          `UPDATE jobs 
           SET embedding_ko = $1::vector,
               updated_at = NOW()
           WHERE id = $2`,
          [JSON.stringify(embedding), job.id]
        )
        const updateDuration = Date.now() - updateStartTime
        
        console.log(`[Embedding] Updated DB in ${updateDuration}ms`)

        processed++
        processedJobs.push({ id: job.id, title: job.title })
        console.log(`[Embedding] ✅ Successfully processed job ${job.id} (total: ${processed})`)

        // OpenAI API Rate Limit 고려 (TPM 제한)
        // text-embedding-3-small: 3,000 RPM, 1,000,000 TPM
        // 안전하게 50ms 대기 (분당 최대 1200개 처리)
        await new Promise(resolve => setTimeout(resolve, 50))
        
      } catch (error: any) {
        failed++
        const errorMsg = error.message || 'Unknown error'
        const errorDetails = {
          id: job.id,
          title: job.title,
          error: errorMsg,
          stack: error.stack?.split('\n')[0] // 첫 번째 스택 라인만
        }
        errors.push(errorDetails)
        
        console.error(`[Embedding] ❌ Failed for job ${job.id}: ${job.title}`)
        console.error(`[Embedding] Error message: ${errorMsg}`)
        console.error(`[Embedding] Error type: ${error.constructor.name}`)
        
        if (error.response) {
          console.error(`[Embedding] API Response Status: ${error.response.status}`)
          console.error(`[Embedding] API Response Data:`, error.response.data)
        }
      }
    }

    const duration = Date.now() - startTime
    console.log(`[Embedding Process] Completed in ${duration}ms`)
    console.log(`[Embedding Process] Success: ${processed}, Failed: ${failed}`)

    return NextResponse.json({
      success: true,
      message: `임베딩 처리 완료: 성공 ${processed}개, 실패 ${failed}개`,
      processed,
      failed,
      duration,
      processedJobs: processedJobs.slice(0, 10), // 최대 10개만 반환
      errors: failed > 0 ? errors : undefined,
      stats: {
        totalRequested: jobsToProcess.length,
        successRate: jobsToProcess.length > 0 
          ? `${((processed / jobsToProcess.length) * 100).toFixed(1)}%` 
          : '0%',
        averageTimePerJob: processed > 0 
          ? `${(duration / processed).toFixed(0)}ms` 
          : 'N/A'
      }
    })
    
  } catch (error: any) {
    console.error('[Embedding Process] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '임베딩 처리 중 오류가 발생했습니다.',
        details: error.stack
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/process-embeddings
 * 임베딩 처리 현황 조회
 */
export async function GET(request: NextRequest) {
  try {
    const pool = getPool()
    
    // 전체 통계
    const { rows: stats } = await pool.query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(embedding_ko) as jobs_with_embedding,
        COUNT(*) - COUNT(embedding_ko) as jobs_without_embedding,
        ROUND(100.0 * COUNT(embedding_ko) / NULLIF(COUNT(*), 0), 2) as coverage_percent
      FROM jobs
    `)

    // 카테고리별 통계
    const { rows: categoryStats } = await pool.query(`
      SELECT 
        category,
        COUNT(*) as total,
        COUNT(embedding_ko) as with_embedding,
        COUNT(*) - COUNT(embedding_ko) as without_embedding
      FROM jobs
      GROUP BY category
      ORDER BY without_embedding DESC
      LIMIT 10
    `)

    // 최근 처리된 일자리
    //id,        title,        region,        category,        updated_at
    const { rows: recentlyProcessed } = await pool.query(`
      SELECT *        
      FROM jobs
      WHERE embedding_ko IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 10
    `)

    return NextResponse.json({
      success: true,
      stats: stats[0],
      categoryStats,
      recentlyProcessed
    })
    
  } catch (error: any) {
    console.error('[Embedding Stats] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '통계 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}
