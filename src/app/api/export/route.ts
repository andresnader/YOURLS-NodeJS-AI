import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const urls = await prisma.url.findMany({
      where: session.role === 'ADMIN' ? {} : { userId: session.id },
      orderBy: { createdAt: 'desc' },
    });

    if (urls.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 404 });
    }

    // CSV Headers
    const headers = ['Keyword', 'Long URL', 'Title', 'Created At', 'Clicks', 'Redirect Type', 'IP'];
    const rows = urls.map(url => [
      url.keyword,
      `"${url.url.replace(/"/g, '""')}"`, // Escape quotes
      `"${(url.title || '').replace(/"/g, '""')}"`,
      url.createdAt.toISOString(),
      url.clicks,
      url.redirectType,
      url.ip || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=yourls-export.csv'
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
