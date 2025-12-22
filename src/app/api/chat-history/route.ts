import { NextRequest, NextResponse } from 'next/server'
import { saveChatMessage, getChatMessages, deleteChatHistory } from '@/lib/db'
import { getJobseekerIdFromRequest } from '@/lib/apiUtils'

// 채팅 메시지 저장
export async function POST(request: NextRequest) {
  try {
    const jobseekerId = await getJobseekerIdFromRequest(request.headers)
    if (!jobseekerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messageText, sender, sessionId } = body

    if (!messageText || !sender) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const message = await saveChatMessage(
      messageText,
      sender,
      jobseekerId,
      sessionId || null
    )

    return NextResponse.json({
      success: true,
      message
    })
  } catch (error: any) {
    console.error('[API /chat-history POST] Error:', error)
    return NextResponse.json(
      { error: error.message || '메시지 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 채팅 메시지 조회
export async function GET(request: NextRequest) {
  try {
    const jobseekerId = await getJobseekerIdFromRequest(request.headers)
    if (!jobseekerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')  // 선택적 필터
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[API /chat-history GET] Params:', { jobseekerId, sessionId, limit, offset })

    // limit + 1개를 조회하여 더 많은 데이터가 있는지 확인
    const messages = await getChatMessages(
      jobseekerId,
      null,  // sessionId 필터 제거 - jobseeker_id로만 조회
      limit + 1,  // ✅ 1개 더 조회
      offset
    )

    // 실제로는 limit개만 반환
    const hasMore = messages.length > limit
    const returnMessages = hasMore ? messages.slice(0, limit) : messages

    console.log('[API /chat-history GET] Messages returned:', returnMessages.length, 'hasMore:', hasMore)

    return NextResponse.json({
      success: true,
      messages: returnMessages,
      hasMore
    })
  } catch (error) {
    console.error('[API /chat-history GET] Error:', error)
    return NextResponse.json(
      { error: '메시지 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 채팅 내역 삭제
export async function DELETE(request: NextRequest) {
  try {
    const jobseekerId = await getJobseekerIdFromRequest(request.headers)
    if (!jobseekerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await deleteChatHistory(jobseekerId)

    return NextResponse.json({
      success: true,
      deleted
    })
  } catch (error) {
    console.error('[API /chat-history DELETE] Error:', error)
    return NextResponse.json(
      { error: '채팅 내역 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
