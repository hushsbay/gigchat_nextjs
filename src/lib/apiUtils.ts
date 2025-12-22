import { getUserByEmail } from './db'

/**
 * 요청 헤더에서 이메일을 추출하고 jobseekerId를 조회합니다.
 * 미들웨어가 x-user-email 헤더를 설정해야 합니다.
 */
export async function getJobseekerIdFromRequest(headers: Headers): Promise<number | null> {
  const email = headers.get('x-user-email')
  
  if (!email) {
    console.error('[apiUtils] No x-user-email header found')
    return null
  }
  
  try {
    const userInfo = await getUserByEmail(email)
    
    if (!userInfo || !userInfo.jobseekerId) {
      console.error(`[apiUtils] User not found or not a jobseeker: ${email}`)
      return null
    }
    
    return userInfo.jobseekerId
  } catch (error) {
    console.error('[apiUtils] Error getting jobseekerId:', error)
    return null
  }
}
