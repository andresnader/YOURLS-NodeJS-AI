import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const params = await context.params;
  const keyword = params.keyword;

  try {
    const urlEntry = await prisma.url.findUnique({
      where: { keyword }
    });

    if (!urlEntry) {
      // Url not found
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Collect analytics silently
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referrer = request.headers.get('referer') || 'Direct';

    // We can't let background promises float in serverless easily without Next.js 'after' API
    // so we await them but optimize them in Promise.all 
    await Promise.all([
      prisma.url.update({
        where: { keyword },
        data: { clicks: { increment: 1 } }
      }),
      prisma.log.create({
        data: {
          shorturl: keyword,
          ipAddress: ip,
          userAgent,
          referrer
        }
      })
    ]);

    return NextResponse.redirect(urlEntry.url);
  } catch (error) {
    console.error(`Error redirecting keyword [${keyword}]:`, error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
