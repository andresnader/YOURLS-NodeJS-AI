import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { forbidden, notFound, serverError, unauthorized } from '@/lib/api-error';

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportGet(): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'ADMIN') return forbidden();

    const urls = await prisma.url.findMany({ orderBy: { createdAt: 'desc' } });
    if (urls.length === 0) return notFound('No data to export');

    const header = ['Keyword', 'Long URL', 'Title', 'Created At', 'Clicks', 'Redirect Type', 'IP'];
    const rows = urls.map(u => [
      u.keyword,
      u.url,
      u.title || '',
      u.createdAt.toISOString(),
      u.clicks,
      u.redirectType,
      u.ip || '',
    ]);

    const csv = [header, ...rows].map(r => r.map(csvEscape).join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="yourls-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('[exportGet]', error);
    return serverError();
  }
}
