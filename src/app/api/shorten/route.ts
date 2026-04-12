import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const { url, customKeyword } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Determine keyword
    const keyword = customKeyword && customKeyword.trim() !== '' 
      ? customKeyword 
      : nanoid(6); // 6 character random keyword if not provided
    
    // Check if keyword exists
    const existing = await prisma.url.findUnique({
      where: { keyword }
    });

    if (existing) {
      return NextResponse.json({ error: 'Keyword already in use' }, { status: 409 });
    }

    // Create the new shortened URL
    const newUrl = await prisma.url.create({
      data: {
        keyword,
        url,
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
      }
    });

    return NextResponse.json({ success: true, data: newUrl });
  } catch (error) {
    console.error('Error shortening URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
