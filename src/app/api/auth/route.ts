import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../prisma/generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username = 'admin', password } = body;
    
    console.log(`Login attempt for user: ${username}`);

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log(`User not found: ${username}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password match for ${username}: ${isMatch}`);

    if (isMatch) {
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
        secure: false, // Temporary for debugging
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

