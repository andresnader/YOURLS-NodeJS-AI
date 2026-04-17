import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ keyword: string }> }
) {
  const params = await context.params;
  const keyword = params.keyword;

  try {
    const url = await prisma.url.findUnique({
      where: { keyword },
      include: {
        logs: {
          orderBy: { clickedAt: 'desc' },
          take: 1000 // Limit for performance
        }
      }
    });

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    // Process statistics
    // 1. Clicks over time (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const timeSeries = last7Days.reduce((acc, date) => {
      acc[date] = 0;
      return acc;
    }, {} as Record<string, number>);

    url.logs.forEach(log => {
      const date = log.clickedAt.toISOString().split('T')[0];
      if (timeSeries[date] !== undefined) {
        timeSeries[date]++;
      }
    });

    // 2. Browser distribution
    const browsers: Record<string, number> = {};
    const os: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const countries: Record<string, number> = {};

    url.logs.forEach(log => {
      browsers[log.browser || 'Unknown'] = (browsers[log.browser || 'Unknown'] || 0) + 1;
      os[log.os || 'Unknown'] = (os[log.os || 'Unknown'] || 0) + 1;
      devices[log.device || 'desktop'] = (devices[log.device || 'desktop'] || 0) + 1;
      if (log.countryCode) {
        countries[log.countryCode] = (countries[log.countryCode] || 0) + 1;
      }
    });

    return NextResponse.json({
      keyword: url.keyword,
      longUrl: url.url,
      totalClicks: url.clicks,
      timeSeries,
      browsers,
      os,
      devices,
      countries
    });
  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
