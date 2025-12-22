import Chatbot from '@/components/Chatbot'
import { getUserByEmail } from '@/lib/db'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  // URL 파라미터에서 email 가져오기
  const params = await searchParams
  const email = params.email || 'oldclock@sbs.co.kr' // 기본값으로 폴백
  
  const userInfo = await getUserByEmail(email)
  
  if (!userInfo || !userInfo.jobseekerId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            사용자를 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 mb-2">
            이메일: {email}
          </p>
          <p className="text-sm text-gray-500">
            해당 사용자가 존재하지 않거나 JOBSEEKER가 아닙니다.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-screen flex flex-col">
      {/* 상단 사용자 정보 표시 */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-700">
            <span className="font-medium">로그인:</span> {userInfo.email}
          </div>
          <div className="text-gray-500">
            <span className="font-medium">User ID:</span> {userInfo.userId} | 
            <span className="font-medium ml-2">Jobseeker ID:</span> {userInfo.jobseekerId}
          </div>
        </div>
      </div>
      
      {/* 채팅봇 영역 */}
      <div className="flex-1 overflow-hidden">
        <Chatbot userId={userInfo.jobseekerId} />
      </div>
    </div>
  )
}

