import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UAParser } from 'ua-parser-js';
import { registrarClic } from '@/lib/click-tracking';

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
    // El contador sí se espera: es un UPDATE de una fila y debe ser exacto.
    await prisma.url.update({
      where: { keyword },
      data: { clicks: { increment: 1 } },
    });

    // La geolocalización y el Log NO se esperan: esperarlos metía la latencia de
    // ip-api.com en cada redirección. registrarClic nunca lanza, así que no hace
    // falta un .catch() aquí, pero se deja explícito para que nadie lo quite.
    void registrarClic(keyword, { ip, userAgent, referrer, browser, os, device })
      .catch((error) => console.error(`[redirect] registro de ${keyword}:`, error));

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
