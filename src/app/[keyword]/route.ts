import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UAParser } from 'ua-parser-js';

export async function GET(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const params = await context.params;
  const keyword = params.keyword;

  try {
    const urlEntry = await prisma.url.findUnique({
      where: { keyword }
    });

    if (!urlEntry) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check for password protection (Phase 4 requirement)
    // If password exists, redirect to a password entry page instead of the final URL
    if (urlEntry.password) {
      return NextResponse.redirect(new URL(`/protected/${keyword}`, request.url));
    }

    // Capture metadata
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referrer = request.headers.get('referer') || 'Direct';

    // Parse User Agent
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const device = parser.getDevice().type || 'desktop';

    // Start background tasks
    // 1. Update clicks
    const updateClicks = prisma.url.update({
      where: { keyword },
      data: { clicks: { increment: 1 } }
    });

    // 2. Fetch Geolocation (Free service)
    const fetchGeo = async () => {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`);
        const geoData = await geoRes.json();
        return geoData.status === 'success' ? geoData.countryCode : null;
      } catch {
        return null;
      }
    };

    // 3. Create Log entry
    const logTask = async () => {
      const countryCode = await fetchGeo();
      await prisma.log.create({
        data: {
          shorturl: keyword,
          ipAddress: ip,
          userAgent,
          referrer,
          browser,
          os,
          device,
          countryCode
        }
      });
    };

    // We use Promise.all to ensure data is saved, but we could also fire and forget 
    // in some environments if context.waitUntil was available.
    // In Next.js, awaiting is safer to prevent the process from being killed.
    await Promise.all([updateClicks, logTask()]);

    // Use specific redirect type (301 or 302/307)
    // 301 = Permanent, 302 = Found (Temporary)
    // Defaulting to 301 if explicitly set, else 307 (Next.js default for redirect)
    const status = urlEntry.redirectType === 301 ? 301 : 307;
    return NextResponse.redirect(urlEntry.url, { status });

  } catch (error) {
    console.error(`Error redirecting keyword [${keyword}]:`, error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
