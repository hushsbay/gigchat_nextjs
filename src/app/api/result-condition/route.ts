import { NextRequest, NextResponse } from 'next/server'
import { saveCondition, getCondition, deleteCondition } from '@/lib/db'
import { getJobseekerIdFromRequest } from '@/lib/apiUtils'

// 일자리 조건 저장
export async function POST(request: NextRequest) {
  try {
    const jobseekerId = await getJobseekerIdFromRequest(request.headers)
    if (!jobseekerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conditionData } = await request.json()

    if (!conditionData) {
      return NextResponse.json(
        { success: false, error: 'conditionData는 필수입니다.' },
        { status: 400 }
      )
    }

    const result = await saveCondition(jobseekerId, conditionData)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[POST /api/result-condition] Error:', error)
    return NextResponse.json(
      { success: false, error: '일자리 조건 저장 실패' },
      { status: 500 }
    )
  }
}

// 일자리 조건 조회
export async function GET(request: NextRequest) {
  try {
    const jobseekerId = await getJobseekerIdFromRequest(request.headers)
    if (!jobseekerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await getCondition(jobseekerId)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[GET /api/result-condition] Error:', error)
    return NextResponse.json(
      { success: false, error: '일자리 조건 조회 실패' },
      { status: 500 }
    )
  }
}

// 일자리 조건 삭제
export async function DELETE(request: NextRequest) {
  try {
    const jobseekerId = await getJobseekerIdFromRequest(request.headers)
    if (!jobseekerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await deleteCondition(jobseekerId)
    return NextResponse.json({ success: true, deleted: result })
  } catch (error) {
    console.error('[DELETE /api/result-condition] Error:', error)
    return NextResponse.json(
      { success: false, error: '일자리 조건 삭제 실패' },
      { status: 500 }
    )
  }
}
