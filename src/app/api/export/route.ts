import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — Export all URLs as CSV
export async function GET() {
  try {
    const urls = await prisma.url.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Build CSV
    const headers = ['Keyword', 'URL', 'Title', 'Clicks', 'Created At', 'IP'];
    const rows = urls.map(u => [
      u.keyword,
      `"${u.url.replace(/"/g, '""')}"`,
      `"${(u.title || '').replace(/"/g, '""')}"`,
      u.clicks.toString(),
      u.createdAt.toISOString(),
      u.ip || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="yourls-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
