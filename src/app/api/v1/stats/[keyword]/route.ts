import { NextResponse } from 'next/server';
import { getKeywordStats } from '@/lib/stats';
import { notFound, serverError } from '@/lib/api-error';

export async function GET(
  _request: Request,
  context: { params: Promise<{ keyword: string }> },
) {
  try {
    const { keyword } = await context.params;
    const stats = await getKeywordStats(keyword);
    if (!stats) return notFound('Keyword not found');
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[stats]', error);
    return serverError();
  }
}
