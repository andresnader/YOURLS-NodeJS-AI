import { describe, it, expect, vi, beforeEach } from 'vitest';

const logCreate = vi.fn();
const urlUpdate = vi.fn();
const urlFindUnique = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    log: { create: (...args: unknown[]) => logCreate(...args) },
    url: { 
      update: (...args: unknown[]) => urlUpdate(...args),
      findUnique: (...args: unknown[]) => urlFindUnique(...args),
    },
  },
}));

const META = {
  ip: '186.3.45.10',
  userAgent: 'Mozilla/5.0',
  referrer: 'Direct',
  browser: 'Safari',
  os: 'iOS',
  device: 'mobile',
};

describe('registrarClic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('crea el Log con la geolocalización obtenida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        status: 'success', countryCode: 'EC', regionName: 'Guayas', city: 'Guayaquil',
      }),
    }));

    const { registrarClic } = await import('@/lib/click-tracking');
    await registrarClic('x7k2f9dm1p', META);

    expect(logCreate).toHaveBeenCalledTimes(1);
    const datos = logCreate.mock.calls[0][0].data;
    expect(datos.shorturl).toBe('x7k2f9dm1p');
    expect(datos.countryCode).toBe('EC');
    expect(datos.city).toBe('Guayaquil');
  });

  it('registra el clic con geolocalización nula si el servicio externo falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const { registrarClic } = await import('@/lib/click-tracking');
    await registrarClic('x7k2f9dm1p', META);

    expect(logCreate).toHaveBeenCalledTimes(1);
    expect(logCreate.mock.calls[0][0].data.countryCode).toBeNull();
  });

  it('no lanza si la base de datos falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ status: 'fail' }) }));
    logCreate.mockRejectedValueOnce(new Error('connection lost'));

    const { registrarClic } = await import('@/lib/click-tracking');
    await expect(registrarClic('x7k2f9dm1p', META)).resolves.toBeUndefined();
  });
});

describe('registrarClic — webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    logCreate.mockResolvedValue({});
  });

  it('emite el webhook firmado al dueño del link', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes('ip-api.com')) {
        return { json: async () => ({ status: 'success', countryCode: 'EC', regionName: 'Guayas', city: 'Guayaquil' }) };
      }
      return fetchMock(url, init);
    }));
    urlFindUnique.mockResolvedValue({
      url: 'https://spc.ameiz.in/q/tok',
      user: { webhookUrl: 'https://spc.ameiz.in/api/webhooks/shortlink', webhookSecret: 'whsec_x' },
    });

    const { registrarClic } = await import('@/lib/click-tracking');
    await registrarClic('x7k2f9dm1p', META);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [destino, init] = fetchMock.mock.calls[0];
    expect(destino).toBe('https://spc.ameiz.in/api/webhooks/shortlink');

    const cuerpo = JSON.parse(init.body);
    expect(cuerpo.event).toBe('link.clicked');
    expect(cuerpo.keyword).toBe('x7k2f9dm1p');
    expect(cuerpo.geo).toEqual({ countryCode: 'EC', region: 'Guayas', city: 'Guayaquil' });

    // La IP no debe viajar: el receptor no la necesita.
    expect(init.body).not.toContain(META.ip);
    expect(cuerpo.ipAddress).toBeUndefined();

    // La firma debe corresponder al cuerpo EXACTO enviado.
    const { firmar } = await import('@/lib/webhook');
    const ts = Number(init.headers['X-Yourls-Timestamp']);
    expect(init.headers['X-Yourls-Signature']).toBe(firmar(init.body, 'whsec_x', ts));
  });

  it('no emite nada si el usuario no tiene webhook configurado', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes('ip-api.com')) return { json: async () => ({ status: 'fail' }) };
      return fetchMock(url, init);
    }));
    urlFindUnique.mockResolvedValue({ url: 'https://ejemplo.com', user: null });

    const { registrarClic } = await import('@/lib/click-tracking');
    await registrarClic('x7k2f9dm1p', META);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('un webhook que falla no impide que el clic quede registrado', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('ip-api.com')) return { json: async () => ({ status: 'fail' }) };
      throw new Error('ETIMEDOUT');
    }));
    urlFindUnique.mockResolvedValue({
      url: 'https://spc.ameiz.in/q/tok',
      user: { webhookUrl: 'https://spc.ameiz.in/api/webhooks/shortlink', webhookSecret: 'whsec_x' },
    });

    const { registrarClic } = await import('@/lib/click-tracking');
    await expect(registrarClic('x7k2f9dm1p', META)).resolves.toBeUndefined();
    expect(logCreate).toHaveBeenCalledOnce();
  });
});
