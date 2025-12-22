import { NextRequest, NextResponse } from 'next/server'
import { applyToJob, cancelApplication, checkApplication } from '@/lib/db'

// 지원하기
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, jobseekerId } = body

    if (!jobId || !jobseekerId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const application = await applyToJob(jobId, jobseekerId)

    return NextResponse.json({
      success: true,
      application,
      message: '지원이 완료되었습니다.'
    })
  } catch (error: any) {
    console.error('[API /applications POST] Error:', error)
    return NextResponse.json(
      { error: error.message || '지원 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 지원 취소
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, jobseekerId } = body

    if (!jobId || !jobseekerId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const success = await cancelApplication(jobId, jobseekerId)

    if (!success) {
      return NextResponse.json(
        { error: '지원 내역을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '지원이 취소되었습니다.'
    })
  } catch (error: any) {
    console.error('[API /applications DELETE] Error:', error)
    return NextResponse.json(
      { error: error.message || '지원 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 지원 여부 확인
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const jobseekerId = searchParams.get('jobseekerId')

    if (!jobId || !jobseekerId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const application = await checkApplication(parseInt(jobId), parseInt(jobseekerId))

    return NextResponse.json({ 
      hasApplied: !!application,
      application: application || null
    })
  } catch (error) {
    console.error('[API /applications GET] Error:', error)
    return NextResponse.json(
      { error: '지원 여부 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
