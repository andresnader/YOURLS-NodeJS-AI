import { describe, it, expect, vi, beforeEach } from 'vitest';

const urlFindUnique = vi.fn();
const urlUpdate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    url: {
      findUnique: (...a: unknown[]) => urlFindUnique(...a),
      update: (...a: unknown[]) => urlUpdate(...a),
    },
  },
}));

// Un registro que NUNCA resuelve. Si la ruta lo espera, la prueba expira.
const registrarClic = vi.fn(() => new Promise<void>(() => {}));
vi.mock('@/lib/click-tracking', () => ({ registrarClic }));

function peticion(keyword: string) {
  return {
    request: new Request(`https://ameiz.in/${keyword}`, {
      headers: { 'user-agent': 'Mozilla/5.0', 'x-forwarded-for': '186.3.45.10' },
    }),
    context: { params: Promise.resolve({ keyword }) },
  };
}

describe('GET /[keyword]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    urlUpdate.mockResolvedValue({});
  });

  it('responde el redirect sin esperar el registro del clic', async () => {
    urlFindUnique.mockResolvedValue({
      keyword: 'x7k2', url: 'https://spc.ameiz.in/q/tok', redirectType: 307, password: null,
    });

    const { request, context } = peticion('x7k2');
    const res = await GET_con_timeout(request, context);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://spc.ameiz.in/q/tok');
    expect(registrarClic).toHaveBeenCalledOnce();
  });

  it('incrementa el contador de clics', async () => {
    urlFindUnique.mockResolvedValue({
      keyword: 'x7k2', url: 'https://spc.ameiz.in/q/tok', redirectType: 307, password: null,
    });

    const { request, context } = peticion('x7k2');
    await GET_con_timeout(request, context);

    expect(urlUpdate).toHaveBeenCalledWith({
      where: { keyword: 'x7k2' },
      data: { clicks: { increment: 1 } },
    });
  });

  it('usa 301 solo cuando el link lo pide explícitamente', async () => {
    urlFindUnique.mockResolvedValue({
      keyword: 'viejo', url: 'https://ejemplo.com', redirectType: 301, password: null,
    });

    const { request, context } = peticion('viejo');
    const res = await GET_con_timeout(request, context);

    expect(res.status).toBe(301);
  });
});

type ContextoRuta = { params: Promise<{ keyword: string }> };

/** Falla la prueba si la ruta tarda más de 1s: significaría que espera el registro. */
async function GET_con_timeout(request: Request, context: ContextoRuta) {
  const { GET } = await import('./route');
  return Promise.race([
    GET(request, context),
    new Promise<never>((_, rechazar) =>
      setTimeout(() => rechazar(new Error('la ruta esperó el registro del clic')), 1000),
    ),
  ]);
}
