import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keywords } = await request.json();
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'Keywords are required' }, { status: 400 });
    }

    const urls = await prisma.url.findMany({
      where: { 
        keyword: { in: keywords },
        ...(session.role !== 'ADMIN' ? { userId: session.id } : {})
      }
    });

    const results = await Promise.all(urls.map(async (item) => {
      let isHealthy = false;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(item.url, { 
          method: 'HEAD', 
          signal: controller.signal,
          headers: { 'User-Agent': 'YOURLS-Node-HealthCheck/1.0' }
        });
        clearTimeout(timeout);
        isHealthy = res.ok;
      } catch (e) {
        isHealthy = false;
      }

      await prisma.url.update({
        where: { keyword: item.keyword },
        data: { isHealthy }
      });

      return { keyword: item.keyword, isHealthy };
    }));

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ error: 'Failed to run health check' }, { status: 500 });
  }
}
