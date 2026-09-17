import prisma from '@/lib/prisma';

export type MetadatosClic = {
  ip: string;
  userAgent: string;
  referrer: string;
  browser: string;
  os: string;
  device: string;
};

type Geo = { countryCode: string | null; region: string | null; city: string | null };

const GEO_NULA: Geo = { countryCode: null, region: null, city: null };

async function obtenerGeo(ip: string): Promise<Geo> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,regionName,city`,
      { signal: AbortSignal.timeout(3000) },
    );
    const datos = await res.json();
    if (datos.status !== 'success') return GEO_NULA;
    return {
      countryCode: datos.countryCode || null,
      region: datos.regionName || null,
      city: datos.city || null,
    };
  } catch {
    return GEO_NULA;
  }
}

/**
 * Registra un clic. Se invoca SIN await desde la ruta de redirección, así que
 * nunca lanza: cualquier fallo se traga y se reporta por consola.
 */
export async function registrarClic(keyword: string, meta: MetadatosClic): Promise<void> {
  try {
    const geo = await obtenerGeo(meta.ip);
    await prisma.log.create({
      data: {
        shorturl: keyword,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        referrer: meta.referrer,
        browser: meta.browser,
        os: meta.os,
        device: meta.device,
        countryCode: geo.countryCode,
        region: geo.region,
        city: geo.city,
      },
    });
  } catch (error) {
    console.error(`[registrarClic] ${keyword}:`, error);
  }
}
