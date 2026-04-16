import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — Dashboard stats summary
export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalLinks, totalClicksResult, linksToday, clicksToday, topLinks] = await Promise.all([
      prisma.url.count(),
      prisma.url.aggregate({ _sum: { clicks: true } }),
      prisma.url.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.log.count({ where: { clickedAt: { gte: todayStart } } }),
      prisma.url.findMany({
        orderBy: { clicks: 'desc' },
        take: 5,
        select: { keyword: true, url: true, title: true, clicks: true },
      }),
    ]);

    return NextResponse.json({
      totalLinks,
      totalClicks: totalClicksResult._sum.clicks || 0,
      linksToday,
      clicksToday,
      topLinks,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
