import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UAParser } from 'ua-parser-js';
import prisma from '@/lib/prisma';

/**
 * Verifies the password for a protected link. On success it records the click
 * (mirroring the logic in src/app/[keyword]/route.ts, which is bypassed for
 * protected links) and returns the destination URL for the client to follow.
 */
export async function POST(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await context.params;

  try {
    const { password } = await request.json().catch(() => ({ password: '' }));

    const entry = await prisma.url.findUnique({ where: { keyword } });
    if (!entry) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Not actually protected → just hand back the URL.
    if (!entry.password) {
      return NextResponse.json({ url: entry.url });
    }

    const ok = typeof password === 'string' && (await bcrypt.compare(password, entry.password));
    if (!ok) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Record the click just like the normal redirect path.
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referrer = request.headers.get('referer') || 'Direct';
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const device = parser.getDevice().type || 'desktop';

    const logTask = async () => {
      let geo = { countryCode: null as string | null, region: null as string | null, city: null as string | null };
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,countryCode,regionName,city`,
        );
        const geoData = await geoRes.json();
        if (geoData.status === 'success') {
          geo = {
            countryCode: geoData.countryCode || null,
            region: geoData.regionName || null,
            city: geoData.city || null,
          };
        }
      } catch {
        /* geolocation is best-effort */
      }
      await prisma.log.create({
        data: {
          shorturl: keyword,
          ipAddress: ip,
          userAgent,
          referrer,
          browser,
          os,
          device,
          countryCode: geo.countryCode,
          region: geo.region,
          city: geo.city,
        },
      });
    };

    await Promise.all([
      prisma.url.update({ where: { keyword }, data: { clicks: { increment: 1 } } }),
      logTask(),
    ]);

    return NextResponse.json({ url: entry.url });
  } catch (error) {
    console.error('[protected verify]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
