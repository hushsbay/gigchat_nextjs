import { Pool } from 'pg'

// PostgreSQL 연결 풀 생성
let pool: Pool | null = null

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DB_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
  }

  return pool
}

export interface Job {
  id: number
  company: string | null
  created_at: Date
  deadline: Date | null
  description: string | null
  job_type: string | null
  location: string | null
  posted_date: Date | null
  salary: string | null
  status: string
  title: string
  updated_at: Date | null
  views: number
  work_days: string | null
  work_hours: string | null
  employer_id: number
  end_time: string | null
  other_requirement: string | null
  qualifications: string | null
  requirements: string | null
  salary_type: string | null
  start_time: string | null
  category: string | null
  age: string | null
  education: string | null
  gender: string | null
  embedding: number[] | null
  embedding_ko: number[] | null
  similarity?: number  // 벡터 검색 시 계산되는 유사도 값
}

// 전체 일자리 조회 (테스트용)
export async function getAllJobs(limit: number = 10): Promise<Job[]> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE status = $1 LIMIT $2',
      ['ACTIVE', limit]
    )
    return result.rows
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// 벡터 검색 (OpenAI embedding 사용)
export async function searchJobsByEmbedding(
  embedding: number[],
  limit: number = 10,
  similarityThreshold: number = 0.1
): Promise<Job[]> {
  const pool = getPool()
  
  try {
    // pgvector 사용 시도
    const result = await pool.query(
      `SELECT *, 
        1 - (embedding_ko <=> $1::vector) as similarity
      FROM jobs 
      WHERE status = 'ACTIVE' 
        AND embedding_ko IS NOT NULL
        AND (1 - (embedding_ko <=> $1::vector)) >= $3
      ORDER BY embedding_ko <=> $1::vector
      LIMIT $2`,
      [JSON.stringify(embedding), limit, similarityThreshold]
    )
    return result.rows
  } catch (error: any) {
    console.error('Vector search error:', error)
    
    // pgvector 확장이 없는 경우 에러 메시지 개선
    if (error.message?.includes('type "vector" does not exist')) {
      console.error('❌ pgvector 확장이 설치되지 않았습니다.')
      console.error('💡 해결 방법: PostgreSQL에서 "CREATE EXTENSION vector;" 실행')
      throw new Error('벡터 검색 기능을 사용할 수 없습니다. 데이터베이스에 pgvector 확장을 설치해주세요.')
    }
    
    throw error
  }
}

// 벡터 검색 (Korean embedding 사용)
export async function searchJobsByEmbeddingKo(
  embedding: number[],
  limit: number = 10
): Promise<Job[]> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      `SELECT *, 
        1 - (embedding_ko <=> $1::vector) as similarity
      FROM jobs 
      WHERE status = 'ACTIVE' AND embedding_ko IS NOT NULL
      ORDER BY embedding_ko <=> $1::vector
      LIMIT $2`,
      [JSON.stringify(embedding), limit]
    )
    return result.rows
  } catch (error) {
    console.error('Vector search (Korean) error:', error)
    throw error
  }
}

// DB 연결 테스트
export async function testConnection(): Promise<boolean> {
  const pool = getPool()
  
  try {
    const result = await pool.query('SELECT NOW()')
    console.log('Database connected successfully:', result.rows[0])
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// 카테고리 인터페이스
export interface Category {
  kind: string
  cd: string
  nm: string
  depth: number
  seq: number
}

// 모든 카테고리 조회
export async function getAllCategories(): Promise<Category[]> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      'SELECT kind, cd, nm, depth, seq FROM category ORDER BY seq'
    )
    return result.rows
  } catch (error) {
    console.error('Get categories error:', error)
    throw error
  }
}

// 대분류 카테고리 조회
export async function getMainCategories(): Promise<Category[]> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      "SELECT cd, nm FROM category WHERE kind = '01' AND depth = 1 ORDER BY seq"
    )
    return result.rows
  } catch (error) {
    console.error('Get main categories error:', error)
    throw error
  }
}

// 중분류 카테고리 조회
export async function getSubCategories(mainCode: string): Promise<Category[]> {
  const pool = getPool()
  
  try {
    const startCode = mainCode + '01'
    const endCode = mainCode + '99'
    const result = await pool.query(
      "SELECT cd, nm FROM category WHERE kind = '01' AND cd BETWEEN $1 AND $2 AND depth = 2 ORDER BY seq",
      [startCode, endCode]
    )
    return result.rows
  } catch (error) {
    console.error('Get sub categories error:', error)
    throw error
  }
}

// Chat 메시지 인터페이스
export interface ChatMessage {
  id: number
  message_text: string
  sender: 'user' | 'bot'
  created_at: Date
  jobseeker_id: number | null
  session_id: string | null
}

// 채팅 메시지 저장
export async function saveChatMessage(
  messageText: string,
  sender: 'user' | 'bot',
  jobseekerId: number | null = null,
  sessionId: string | null = null
): Promise<ChatMessage> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      `INSERT INTO chat (message_text, sender, created_at, jobseeker_id, session_id) 
       VALUES ($1, $2, NOW(), $3, $4) 
       RETURNING *`,
      [messageText, sender, jobseekerId, sessionId]
    )
    return result.rows[0]
  } catch (error) {
    console.error('Save chat message error:', error)
    throw error
  }
}

// 채팅 메시지 조회 (최신순, 페이지네이션)
export async function getChatMessages(
  jobseekerId: number | null = null,
  sessionId: string | null = null,
  limit: number = 20,
  offset: number = 0
): Promise<ChatMessage[]> {
  const pool = getPool()
  
  try {
    let query = 'SELECT * FROM chat WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (jobseekerId !== null) {
      query += ` AND jobseeker_id = $${paramIndex}`
      params.push(jobseekerId)
      paramIndex++
    }

    if (sessionId !== null) {
      query += ` AND session_id = $${paramIndex}`
      params.push(sessionId)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    console.log('[getChatMessages] Query:', query)
    console.log('[getChatMessages] Params:', params)

    const result = await pool.query(query, params)
    
    console.log('[getChatMessages] Rows returned:', result.rows.length)
    
    return result.rows.reverse() // 오래된 순서로 변환
  } catch (error) {
    console.error('Get chat messages error:', error)
    throw error
  }
}

// 채팅 내역 전체 삭제 (사용자별)
export async function deleteChatHistory(jobseekerId: number): Promise<boolean> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      'DELETE FROM chat WHERE jobseeker_id = $1 RETURNING id',
      [jobseekerId]
    )
    return result.rows.length > 0
  } catch (error) {
    console.error('Delete chat history error:', error)
    throw error
  }
}

// 특정 일자리 상세 조회
export async function getJobById(jobId: number): Promise<Job | null> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [jobId]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Get job by id error:', error)
    throw error
  }
}

// 지원 인터페이스
export interface Application {
  id: number
  job_id: number
  jobseeker_id: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  applied_date: Date
  suitability: number | null
  created_at: Date
  updated_at: Date | null
}

// 지원 여부 확인
export async function checkApplication(jobId: number, jobseekerId: number): Promise<Application | null> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      'SELECT * FROM applications WHERE job_id = $1 AND jobseeker_id = $2',
      [jobId, jobseekerId]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Check application error:', error)
    throw error
  }
}

// 지원하기
export async function applyToJob(jobId: number, jobseekerId: number): Promise<Application> {
  const pool = getPool()
  
  try {
    // 트랜잭션 시작
    await pool.query('BEGIN')
    
    // 중복 지원 확인
    const existing = await pool.query(
      'SELECT id FROM applications WHERE job_id = $1 AND jobseeker_id = $2',
      [jobId, jobseekerId]
    )
    
    if (existing.rows.length > 0) {
      await pool.query('ROLLBACK')
      throw new Error('이미 지원한 일자리입니다.')
    }
    
    // 지원 등록
    const result = await pool.query(
      `INSERT INTO applications (job_id, jobseeker_id, status, applied_date, created_at) 
       VALUES ($1, $2, 'PENDING', NOW(), NOW()) 
       RETURNING *`,
      [jobId, jobseekerId]
    )
    
    await pool.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('Apply to job error:', error)
    throw error
  }
}

// 지원 취소
export async function cancelApplication(jobId: number, jobseekerId: number): Promise<boolean> {
  const pool = getPool()
  
  try {
    // 트랜잭션 시작
    await pool.query('BEGIN')
    
    const result = await pool.query(
      'DELETE FROM applications WHERE job_id = $1 AND jobseeker_id = $2 RETURNING id',
      [jobId, jobseekerId]
    )
    
    await pool.query('COMMIT')
    return result.rows.length > 0
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('Cancel application error:', error)
    throw error
  }
}

// ============ Result Condition 관련 함수 ============

export interface ResultCondition {
  id: number
  jobseeker_id: number
  condition_data: any
  created_at: Date
}

// 일자리 조건 저장 (기존 데이터 삭제 후 신규 저장)
export async function saveCondition(jobseekerId: number, conditionData: any): Promise<ResultCondition> {
  const pool = getPool()
  
  try {
    await pool.query('BEGIN')
    
    // 기존 데이터 삭제
    await pool.query(
      'DELETE FROM result_condition WHERE jobseeker_id = $1',
      [jobseekerId]
    )
    
    // 신규 데이터 저장
    const result = await pool.query(
      `INSERT INTO result_condition (jobseeker_id, condition_data, created_at) 
       VALUES ($1, $2, NOW()) 
       RETURNING *`,
      [jobseekerId, JSON.stringify(conditionData)]
    )
    
    await pool.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('Save condition error:', error)
    throw error
  }
}

// 일자리 조건 조회
export async function getCondition(jobseekerId: number): Promise<ResultCondition | null> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      'SELECT * FROM result_condition WHERE jobseeker_id = $1',
      [jobseekerId]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Get condition error:', error)
    throw error
  }
}

// 일자리 조건 삭제
export async function deleteCondition(jobseekerId: number): Promise<boolean> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      'DELETE FROM result_condition WHERE jobseeker_id = $1 RETURNING id',
      [jobseekerId]
    )
    return result.rows.length > 0
  } catch (error) {
    console.error('Delete condition error:', error)
    throw error
  }
}

// ============ Result Search 관련 함수 ============

export interface ResultSearch {
  id: number
  jobseeker_id: number
  job_id: number
  created_at: Date
}

// 검색 결과 저장 (기존 데이터 삭제 후 신규 저장)
export async function saveSearchResults(jobseekerId: number, jobIds: number[]): Promise<ResultSearch[]> {
  const pool = getPool()
  
  try {
    await pool.query('BEGIN')
    
    // 기존 데이터 삭제
    await pool.query(
      'DELETE FROM result_search WHERE jobseeker_id = $1',
      [jobseekerId]
    )
    
    // 신규 데이터 저장
    const results: ResultSearch[] = []
    for (const jobId of jobIds) {
      const result = await pool.query(
        `INSERT INTO result_search (jobseeker_id, job_id, created_at) 
         VALUES ($1, $2, NOW()) 
         RETURNING *`,
        [jobseekerId, jobId]
      )
      results.push(result.rows[0])
    }
    
    await pool.query('COMMIT')
    return results
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('Save search results error:', error)
    throw error
  }
}

// 검색 결과 조회 (Job 정보 포함)
export async function getSearchResults(jobseekerId: number): Promise<Job[]> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      `SELECT j.* FROM result_search rs
       INNER JOIN jobs j ON rs.job_id = j.id
       WHERE rs.jobseeker_id = $1
       ORDER BY rs.created_at ASC`,
      [jobseekerId]
    )
    return result.rows
  } catch (error) {
    console.error('Get search results error:', error)
    throw error
  }
}

// 검색 결과 삭제
export async function deleteSearchResults(jobseekerId: number): Promise<boolean> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      'DELETE FROM result_search WHERE jobseeker_id = $1 RETURNING id',
      [jobseekerId]
    )
    return result.rows.length > 0
  } catch (error) {
    console.error('Delete search results error:', error)
    throw error
  }
}

// 결과내검색 (기존 검색 결과 범위 내에서 벡터 검색)
export async function searchJobsInResults(
  jobseekerId: number,
  embedding: number[],
  limit: number = 10,
  similarityThreshold: number = 0.1
): Promise<Job[]> {
  const pool = getPool()
  
  try {
    const result = await pool.query(
      `SELECT j.*, 
        1 - (j.embedding_ko <=> $1::vector) as similarity
      FROM jobs j
      INNER JOIN result_search rs ON j.id = rs.job_id
      WHERE rs.jobseeker_id = $2
        AND j.status = 'ACTIVE' 
        AND j.embedding_ko IS NOT NULL
        AND (1 - (j.embedding_ko <=> $1::vector)) >= $4
      ORDER BY j.embedding_ko <=> $1::vector
      LIMIT $3`,
      [JSON.stringify(embedding), jobseekerId, limit, similarityThreshold]
    )
    return result.rows
  } catch (error) {
    console.error('Search in results error:', error)
    throw error
  }
}

// ============ User 관련 함수 ============

export interface User {
  id: number
  email: string
  user_type: 'JOBSEEKER' | 'EMPLOYER'
  created_at: Date
}

export interface JobseekerProfile {
  id: number
  user_id: number
  name: string
  birth: Date | null
  gender: string | null
  phone: string | null
  address: string | null
}

// 이메일로 사용자 및 구직자 ID 조회
export async function getUserByEmail(email: string): Promise<{ userId: number; jobseekerId: number | null; email: string } | null> {
  const pool = getPool()
  
  try {
    // users 테이블에서 사용자 조회
    const userQuery = 'SELECT id, email, user_type FROM users WHERE email = $1'
    const userResult = await pool.query(userQuery, [email])
    
    if (userResult.rows.length === 0) {
      return null
    }
    
    const user = userResult.rows[0]
    
    // JOBSEEKER인 경우 jobseeker_profiles에서 ID 조회
    if (user.user_type === 'JOBSEEKER') {
      const jsQuery = 'SELECT id FROM jobseeker_profiles WHERE user_id = $1'
      const jsResult = await pool.query(jsQuery, [user.id])
      
      if (jsResult.rows.length > 0) {
        return {
          userId: user.id,
          jobseekerId: jsResult.rows[0].id,
          email: user.email
        }
      }
    }
    
    return {
      userId: user.id,
      jobseekerId: null,
      email: user.email
    }
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}
