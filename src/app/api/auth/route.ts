import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin';

    console.log('--- Auth Debug ---');
    console.log('Received:', password);
    console.log('Expected:', correctPassword);
    console.log('Match:', password === correctPassword);
    console.log('------------------');

    if (password === correctPassword) {
      // Set an HTTP-only cookie to identify the session
      const response = NextResponse.json({ success: true });
      response.cookies.set('yourls_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 semana
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Para Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('yourls_session');
  return response;
}
