import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../prisma/generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { username = 'admin', password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      // Set an HTTP-only cookie to identify the session
      const response = NextResponse.json({ 
        success: true, 
        user: { username: user.username, role: user.role } 
      });
      
      const sessionData = JSON.stringify({
        id: user.id,
        username: user.username,
        role: user.role
      });

      response.cookies.set('yourls_session', sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// For Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('yourls_session');
  return response;
}

