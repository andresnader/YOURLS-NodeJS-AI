import prisma from '@/lib/prisma';

export type KeywordStats = {
  keyword: string;
  longUrl: string;
  totalClicks: number;
  timeSeries: Record<string, number>;
  browsers: Record<string, number>;
  os: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
};

export async function getKeywordStats(keyword: string): Promise<KeywordStats | null> {
  const url = await prisma.url.findUnique({
    where: { keyword },
    include: {
      logs: {
        orderBy: { clickedAt: 'desc' },
        take: 1000,
      },
    },
  });

  if (!url) return null;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const timeSeries: Record<string, number> = {};
  for (const date of last7Days) timeSeries[date] = 0;

  const browsers: Record<string, number> = {};
  const os: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const countries: Record<string, number> = {};

  for (const log of url.logs) {
    const date = log.clickedAt.toISOString().split('T')[0];
    if (timeSeries[date] !== undefined) timeSeries[date]++;

    const b = log.browser || 'Unknown';
    browsers[b] = (browsers[b] || 0) + 1;
    const o = log.os || 'Unknown';
    os[o] = (os[o] || 0) + 1;
    const d = log.device || 'desktop';
    devices[d] = (devices[d] || 0) + 1;
    if (log.countryCode) countries[log.countryCode] = (countries[log.countryCode] || 0) + 1;
  }

  return {
    keyword: url.keyword,
    longUrl: url.url,
    totalClicks: url.clicks,
    timeSeries,
    browsers,
    os,
    devices,
    countries,
  };
}
