/**
 * QR endpoint consumed by the WordPress plugin (yourls-node-integration).
 *
 * The plugin uses this URL as the `src` of an `<img>` and the `href` of a
 * download link, so the response must be image bytes (not JSON). To avoid
 * pulling a server-side QR library into the Next.js bundle, we 302-redirect
 * to a public QR service. If the keyword does not exist, return 404.
 *
 * Why redirect instead of generating locally: the only data leaked to the
 * third party is the keyword and the public short URL, which is already
 * public by definition. Swap in a local generator (e.g. `qrcode` npm pkg)
 * if/when stricter isolation is needed.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const QR_PROVIDER = 'https://api.qrserver.com/v1/create-qr-code/';

export async function GET(
  request: Request,
  context: { params: Promise<{ keyword: string }> },
) {
  const { keyword } = await context.params;

  const url = await prisma.url.findUnique({
    where: { keyword },
    select: { keyword: true },
  });
  if (!url) {
    return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    new URL(request.url).origin;
  const target = `${base}/${keyword}`;

  const sizeParam = new URL(request.url).searchParams.get('size');
  const size = /^\d{2,4}$/.test(sizeParam ?? '') ? sizeParam : '300';

  const qrUrl = `${QR_PROVIDER}?size=${size}x${size}&data=${encodeURIComponent(target)}`;
  return NextResponse.redirect(qrUrl, 302);
}
