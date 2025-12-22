import { NextRequest, NextResponse } from 'next/server'
import { saveSearchResults, getSearchResults, deleteSearchResults } from '@/lib/db'
import { getJobseekerIdFromRequest } from '@/lib/apiUtils'

// 검색 결과 저장
export async function POST(request: NextRequest) {
  try {
    const jobseekerId = await getJobseekerIdFromRequest(request.headers)
    if (!jobseekerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobIds } = await request.json()

    if (!jobIds || !Array.isArray(jobIds)) {
      return NextResponse.json(
        { success: false, error: 'jobIds(배열)는 필수입니다.' },
        { status: 400 }
      )
    }

    const result = await saveSearchResults(jobseekerId, jobIds)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[POST /api/result-search] Error:', error)
    return NextResponse.json(
      { success: false, error: '검색 결과 저장 실패' },
      { status: 500 }
    )
  }
}

// 검색 결과 조회
export async function GET(request: NextRequest) {
  try {
    const jobseekerId = await getJobseekerIdFromRequest(request.headers)
    if (!jobseekerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await getSearchResults(jobseekerId)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[GET /api/result-search] Error:', error)
    return NextResponse.json(
      { success: false, error: '검색 결과 조회 실패' },
      { status: 500 }
    )
  }
}

// 검색 결과 삭제
export async function DELETE(request: NextRequest) {
  try {
    const jobseekerId = await getJobseekerIdFromRequest(request.headers)
    if (!jobseekerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await deleteSearchResults(jobseekerId)
    return NextResponse.json({ success: true, deleted: result })
  } catch (error) {
    console.error('[DELETE /api/result-search] Error:', error)
    return NextResponse.json(
      { success: false, error: '검색 결과 삭제 실패' },
      { status: 500 }
    )
  }
}
