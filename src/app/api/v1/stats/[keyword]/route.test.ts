import { describe, it, expect, vi, beforeEach } from 'vitest';

const getSession = vi.fn();
vi.mock('@/lib/session', () => ({ getSession: () => getSession() }));

const getKeywordStats = vi.fn();
vi.mock('@/lib/stats', () => ({ getKeywordStats: (k: string) => getKeywordStats(k) }));

const urlFindUnique = vi.fn();
vi.mock('@/lib/prisma', () => ({
  default: { url: { findUnique: (...a: unknown[]) => urlFindUnique(...a) } },
}));

function contexto(keyword: string) {
  return { params: Promise.resolve({ keyword }) };
}

describe('GET /api/v1/stats/[keyword]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve 401 sin sesión', async () => {
    getSession.mockResolvedValue(null);
    const { GET } = await import('./route');

    const res = await GET(new Request('https://ameiz.in'), contexto('x7k2'));

    expect(res.status).toBe(401);
    expect(getKeywordStats).not.toHaveBeenCalled();
  });

  it('devuelve 403 si el keyword es de otro usuario', async () => {
    getSession.mockResolvedValue({ id: 'u-1', username: 'ana', role: 'USER' });
    urlFindUnique.mockResolvedValue({ keyword: 'x7k2', userId: 'u-2' });
    const { GET } = await import('./route');

    const res = await GET(new Request('https://ameiz.in'), contexto('x7k2'));

    expect(res.status).toBe(403);
    expect(getKeywordStats).not.toHaveBeenCalled();
  });

  it('devuelve las estadísticas al dueño', async () => {
    getSession.mockResolvedValue({ id: 'u-1', username: 'ana', role: 'USER' });
    urlFindUnique.mockResolvedValue({ keyword: 'x7k2', userId: 'u-1' });
    getKeywordStats.mockResolvedValue({ clicks: 4, countries: { EC: 4 } });
    const { GET } = await import('./route');

    const res = await GET(new Request('https://ameiz.in'), contexto('x7k2'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ clicks: 4, countries: { EC: 4 } });
  });

  it('un ADMIN puede ver cualquier keyword', async () => {
    getSession.mockResolvedValue({ id: 'u-9', username: 'root', role: 'ADMIN' });
    urlFindUnique.mockResolvedValue({ keyword: 'x7k2', userId: 'u-1' });
    getKeywordStats.mockResolvedValue({ clicks: 1 });
    const { GET } = await import('./route');

    const res = await GET(new Request('https://ameiz.in'), contexto('x7k2'));

    expect(res.status).toBe(200);
  });

  it('devuelve 404 si el keyword no existe', async () => {
    getSession.mockResolvedValue({ id: 'u-1', username: 'ana', role: 'USER' });
    urlFindUnique.mockResolvedValue(null);
    const { GET } = await import('./route');

    const res = await GET(new Request('https://ameiz.in'), contexto('nada'));

    expect(res.status).toBe(404);
  });
});
