import { describe, it, expect, vi, beforeEach } from 'vitest';

const logCreate = vi.fn();
const urlUpdate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    log: { create: (...args: unknown[]) => logCreate(...args) },
    url: { update: (...args: unknown[]) => urlUpdate(...args) },
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
