import { NextRequest, NextResponse } from 'next/server'
import { getJobById } from '@/lib/db'

export async function GET(
  request: NextRequest,
  // { params }: { params: { id: string } }
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const jobId = parseInt((await params).id)
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      )
    }

    const job = await getJobById(jobId)

    if (!job) {
      return NextResponse.json(
        { error: '일자리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('[API /jobs/:id] Error:', error)
    return NextResponse.json(
      { error: '일자리 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

