import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — Per-link analytics
export async function GET(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const params = await context.params;
  try {
    const urlEntry = await prisma.url.findUnique({
      where: { keyword: params.keyword },
    });

    if (!urlEntry) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    // Get all logs for this URL
    const logs = await prisma.log.findMany({
      where: { shorturl: params.keyword },
      orderBy: { clickedAt: 'desc' },
    });

    // Referrer breakdown
    const referrerMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};

    for (const log of logs) {
      // Referrers
      const ref = log.referrer || 'Direct';
      referrerMap[ref] = (referrerMap[ref] || 0) + 1;

      // Browsers (simplified)
      const ua = log.userAgent || 'Unknown';
      let browser = 'Other';
      if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('Edg')) browser = 'Edge';
      else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
      browserMap[browser] = (browserMap[browser] || 0) + 1;

      // Daily clicks (last 30 days)
      const day = log.clickedAt.toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    }

    // Convert maps to sorted arrays
    const referrers = Object.entries(referrerMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const browsers = Object.entries(browserMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Last 30 days daily data
    const dailyClicks = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // Recent logs
    const recentLogs = logs.slice(0, 20).map(log => ({
      id: log.id,
      clickedAt: log.clickedAt,
      referrer: log.referrer || 'Direct',
      userAgent: log.userAgent,
      ipAddress: log.ipAddress,
      countryCode: log.countryCode,
    }));

    return NextResponse.json({
      url: urlEntry,
      totalClicks: urlEntry.clicks,
      referrers,
      browsers,
      dailyClicks,
      recentLogs,
    });
  } catch (error) {
    console.error('Error fetching URL stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
