import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// 기존 토큰 검증
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No token found' },
        { status: 401 }
      )
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    return NextResponse.json({ 
      success: true,
      userId: decoded.id || decoded.userId,
      userType: decoded.userType,
      email: decoded.email
    })
  } catch (error) {
    console.error('[API /auth/verify] Error:', error)
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }
}
