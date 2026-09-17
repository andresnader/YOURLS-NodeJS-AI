import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getKeywordStats } from '@/lib/stats';
import { forbidden, notFound, serverError, unauthorized } from '@/lib/api-error';

export async function GET(
  _request: Request,
  context: { params: Promise<{ keyword: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { keyword } = await context.params;

    // Se comprueba la propiedad antes de calcular nada: las estadísticas
    // incluyen ciudades e IPs derivadas y no deben salir a un tercero.
    const url = await prisma.url.findUnique({
      where: { keyword },
      select: { userId: true },
    });
    if (!url) return notFound('Keyword not found');
    if (session.role !== 'ADMIN' && url.userId !== session.id) return forbidden();

    const stats = await getKeywordStats(keyword);
    if (!stats) return notFound('Keyword not found');
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[stats]', error);
    return serverError();
  }
}
