import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// 토큰을 쿠키에 저장
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // 쿠키에 저장
    const response = NextResponse.json({ 
      success: true,
      userId: decoded.id || decoded.userId,
      userType: decoded.userType,
      email: decoded.email
    })
    
    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24시간
    })

    return response
  } catch (error) {
    console.error('[API /auth/set-token] Error:', error)
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }
}
