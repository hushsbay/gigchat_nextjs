import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// API 요청에서 하드코딩된 이메일을 헤더에 추가
const HARDCODED_EMAIL = 'oldclock@sbs.co.kr'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // API 요청 처리
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    
    // /api/auth/* 경로는 헤더 체크 생략
    if (!pathname.startsWith('/api/auth/')) {
      // 하드코딩된 이메일을 헤더에 추가 (API에서 DB 조회)
      requestHeaders.set('x-user-email', HARDCODED_EMAIL)
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}
