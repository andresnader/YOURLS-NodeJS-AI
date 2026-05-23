/**
 * Legacy alias for /api/v1/stats/[keyword]. Returns the WP-plugin–compatible
 * shape: { success: true, data: { ...stats, clicks } }. New clients should
 * use /api/v1/stats/[keyword] which returns the flat shape.
 */
import { NextResponse } from 'next/server';
import { getKeywordStats } from '@/lib/stats';
import { getSession } from '@/lib/session';

export async function GET(
  _request: Request,
  context: { params: Promise<{ keyword: string }> },
) {
  const { keyword } = await context.params;

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getKeywordStats(keyword);
    if (!stats) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { ...stats, clicks: stats.totalClicks },
    });
  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
