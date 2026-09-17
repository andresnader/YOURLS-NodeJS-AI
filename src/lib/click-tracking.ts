import prisma from '@/lib/prisma';
import { firmar } from '@/lib/webhook';

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
    await emitirWebhook(keyword, geo, meta);
  } catch (error) {
    console.error(`[registrarClic] ${keyword}:`, error);
  }
}

type DatosWebhook = {
  event: 'link.clicked';
  keyword: string;
  url: string;
  clickedAt: string;
  geo: Geo;
  device: string;
  browser: string;
  os: string;
  referrer: string;
};

/**
 * Entrega best-effort: timeout corto, sin reintentos y sin cola. La API de
 * estadísticas es la fuente de verdad, así que un aviso perdido no descuadra
 * ningún conteo. Nunca lanza.
 */
async function emitirWebhook(keyword: string, geo: Geo, meta: MetadatosClic): Promise<void> {
  try {
    const registro = await prisma.url.findUnique({
      where: { keyword },
      select: { url: true, user: { select: { webhookUrl: true, webhookSecret: true } } },
    });

    const destino = registro?.user?.webhookUrl;
    const secreto = registro?.user?.webhookSecret;
    if (!registro || !destino || !secreto) return;

    const datos: DatosWebhook = {
      event: 'link.clicked',
      keyword,
      url: registro.url,
      clickedAt: new Date().toISOString(),
      geo,
      device: meta.device,
      browser: meta.browser,
      os: meta.os,
      referrer: meta.referrer,
    };

    // Se serializa UNA vez y se firma esa misma cadena: firmar el objeto y
    // serializar aparte rompería la verificación en el receptor.
    const cuerpo = JSON.stringify(datos);
    const timestamp = Math.floor(Date.now() / 1000);

    await fetch(destino, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Yourls-Timestamp': String(timestamp),
        'X-Yourls-Signature': firmar(cuerpo, secreto, timestamp),
      },
      body: cuerpo,
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    console.error(`[emitirWebhook] ${keyword}:`, error);
  }
}
