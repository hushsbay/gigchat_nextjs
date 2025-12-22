import { NextRequest, NextResponse } from 'next/server'
import type { Condition } from '@/lib/graph/state'
import { getJobseekerIdFromRequest } from '@/lib/apiUtils'

export async function POST(request: NextRequest) {
  try {
    // 인증 체크 (헤더에 x-user-email 있는지 확인)
    const jobseekerId = await getJobseekerIdFromRequest(request.headers)
    if (!jobseekerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, condition, search, searchInResults, similarityThreshold } = body as {
      text: string
      condition?: Partial<Condition>
      search?: boolean
      searchInResults?: boolean
      similarityThreshold?: number
    }

    if (!text && !condition) {
      return NextResponse.json(
        { error: '입력이 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('[API /chat] Request:', { jobseekerId, text, condition, search, searchInResults, similarityThreshold })

    // TODO: FastAPI 서버로 호출하도록 구현 예정
    // 현재는 기본 응답만 반환
    const result = {
      response: '현재 langgraph가 제거되었습니다. FastAPI로 연동할 예정입니다.',
      result: [],
      condition: condition || {},
    }

    console.log('[API /chat] Result:', result)

    return NextResponse.json({
      success: true,
      response: result.response,
      result: result.result,
      condition: result.condition,
    })
  } catch (error) {
    console.error('[API /chat] Error:', error)
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
