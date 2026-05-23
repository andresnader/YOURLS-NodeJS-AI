import prisma from '@/lib/prisma';

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

export type RecentClick = {
  at: string;
  countryCode: string | null;
  city: string | null;
  browser: string | null;
  device: string | null;
  os: string | null;
  referrer: string | null;
};

export type KeywordStats = {
  keyword: string;
  longUrl: string;
  totalClicks: number;
  rangeClicks: number;
  range: TimeRange;
  timeSeries: Record<string, number>;
  hourlyHeatmap: number[][]; // [dayOfWeek 0..6][hour 0..23]
  browsers: Record<string, number>;
  os: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
  cities: Record<string, number>;
  referrers: Record<string, number>;
  recentClicks: RecentClick[];
};

const RANGE_DAYS: Record<TimeRange, number | null> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

/** Friendly host extraction. "Direct" or null → "Direct". */
function normalizeReferrer(ref: string | null): string {
  if (!ref || ref === 'Direct') return 'Direct';
  try {
    return new URL(ref).host || 'Direct';
  } catch {
    return ref.slice(0, 80);
  }
}

export async function getKeywordStats(
  keyword: string,
  range: TimeRange = '7d',
): Promise<KeywordStats | null> {
  const url = await prisma.url.findUnique({
    where: { keyword },
  });
  if (!url) return null;

  const days = RANGE_DAYS[range];
  const since =
    days === null
      ? null
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await prisma.log.findMany({
    where: {
      shorturl: keyword,
      ...(since ? { clickedAt: { gte: since } } : {}),
    },
    orderBy: { clickedAt: 'desc' },
    take: 5000,
  });

  // Time series buckets — daily when range >= 7d, hourly when 24h.
  const timeSeries: Record<string, number> = {};
  if (range === '24h') {
    for (let i = 23; i >= 0; i--) {
      const d = new Date();
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() - i);
      timeSeries[d.toISOString().slice(0, 13)] = 0; // "YYYY-MM-DDTHH"
    }
  } else {
    const bucketDays = days ?? 7;
    for (let i = bucketDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      timeSeries[d.toISOString().slice(0, 10)] = 0; // "YYYY-MM-DD"
    }
  }

  // Day-of-week × hour heatmap (uses all logs in range)
  const hourlyHeatmap: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0),
  );

  const browsers: Record<string, number> = {};
  const os: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const countries: Record<string, number> = {};
  const cities: Record<string, number> = {};
  const referrers: Record<string, number> = {};

  for (const log of logs) {
    const at = log.clickedAt;
    const bucket =
      range === '24h'
        ? at.toISOString().slice(0, 13)
        : at.toISOString().slice(0, 10);
    if (timeSeries[bucket] !== undefined) timeSeries[bucket]++;

    hourlyHeatmap[at.getUTCDay()][at.getUTCHours()]++;

    const b = log.browser || 'Unknown';
    browsers[b] = (browsers[b] || 0) + 1;
    const o = log.os || 'Unknown';
    os[o] = (os[o] || 0) + 1;
    const d = log.device || 'desktop';
    devices[d] = (devices[d] || 0) + 1;
    if (log.countryCode)
      countries[log.countryCode] = (countries[log.countryCode] || 0) + 1;
    if (log.city) cities[log.city] = (cities[log.city] || 0) + 1;

    const refKey = normalizeReferrer(log.referrer);
    referrers[refKey] = (referrers[refKey] || 0) + 1;
  }

  const recentClicks: RecentClick[] = logs.slice(0, 25).map((log) => ({
    at: log.clickedAt.toISOString(),
    countryCode: log.countryCode,
    city: log.city,
    browser: log.browser,
    device: log.device,
    os: log.os,
    referrer: normalizeReferrer(log.referrer),
  }));

  return {
    keyword: url.keyword,
    longUrl: url.url,
    totalClicks: url.clicks,
    rangeClicks: logs.length,
    range,
    timeSeries,
    hourlyHeatmap,
    browsers,
    os,
    devices,
    countries,
    cities,
    referrers,
    recentClicks,
  };
}
