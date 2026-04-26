import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('[test] Request received');
    console.log('[test] Content-Type:', request.headers.get('content-type'));

    const body = await request.json();
    console.log('[test] Body parsed:', body);

    return NextResponse.json({ success: true, received: body });
  } catch (error) {
    console.error('[test] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Test endpoint working' });
}