# Integración con el Cotizador — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar este acortador listo para que el Cotizador Ameizin publique links de cotización: redirección que no espere a servicios externos, endpoint de estadísticas autenticado, y webhook de clic firmado con HMAC.

**Architecture:** El registro de clic se extrae de la ruta de redirección a un módulo propio (`src/lib/click-tracking.ts`) que la ruta dispara **sin esperarlo**. Ese módulo, tras crear el `Log`, emite un webhook firmado al consumidor configurado en el `User` dueño del link. La firma vive en un módulo puro y aparte (`src/lib/webhook.ts`) para poder probarla sin red ni base de datos.

**Tech Stack:** Next.js 16.2.3 (App Router), Prisma + PostgreSQL, TypeScript, Zod, Vitest (se añade en la Tarea 1). Alias `@/*` → `./src/*`.

**Spec:** `/Users/andresnader/Desktop/Code/cotizador-ameizin/docs/superpowers/specs/2026-09-17-cotizacion-viva-y-shortlinks-design.md` (secciones "Estado actual → YOURLS" y "Pieza D — Cambios en YOURLS")

## Global Constraints

- Node y Next se quedan donde están: **no** actualizar `next` (16.2.3) ni ninguna dependencia existente
- Alias de imports: `@/lib/...` resuelve a `src/lib/...`. Usarlo siempre; nunca rutas relativas largas
- La rama de trabajo es `master`. Crear rama `feat/integracion-cotizador` y no commitear a `master` directo
- Todo mensaje visible al usuario final va en español; el código, los identificadores y los comentarios también van en español, siguiendo lo que ya hace el repo
- **Ningún cambio puede añadir latencia a la redirección.** Es el criterio que gobierna la Tarea 2 y lo que la Tarea 5 no debe deshacer
- Los errores de API se construyen con los helpers de `src/lib/api-error.ts` (`unauthorized()`, `forbidden()`, `notFound()`, `serverError()`), nunca con `NextResponse.json` a mano
- **No tocar** `.github/workflows/ci.yml` ni `.github/workflows/update-geoip.yml`. Ambos son restos del YOURLS original en PHP y están fuera del alcance de este plan (ver "Deuda observada" al final)

---

### Task 1: Vitest y extracción del registro de clic

Hoy la lógica de registro está incrustada en la ruta de redirección, así que no se puede
probar sin levantar Next. Se extrae a un módulo propio, que es también el lugar donde la
Tarea 5 colgará el webhook. El repositorio no tiene ningún framework de pruebas, así que se
configura aquí.

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/click-tracking.ts`
- Create: `src/lib/click-tracking.test.ts`
- Modify: `package.json` (scripts y devDependencies)
- Modify: `src/app/[keyword]/route.ts`

**Interfaces:**
- Consumes: nada de tareas anteriores
- Produces:
  - `registrarClic(keyword: string, meta: MetadatosClic): Promise<void>` — nunca lanza; captura sus propios errores
  - `type MetadatosClic = { ip: string; userAgent: string; referrer: string; browser: string; os: string; device: string }`

- [ ] **Step 1: Instalar Vitest**

```bash
npm install --save-dev vitest@^3
```

- [ ] **Step 2: Crear `vitest.config.ts`**

El alias se define a mano para no añadir `vite-tsconfig-paths` como dependencia.

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Añadir el script de pruebas a `package.json`**

En el objeto `scripts`, junto a `lint`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Escribir la prueba que falla**

Crear `src/lib/click-tracking.test.ts`:

```ts
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
```

- [ ] **Step 5: Correr la prueba y verificar que falla**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/click-tracking'`

- [ ] **Step 6: Crear `src/lib/click-tracking.ts`**

La geolocalización y el `create` se mueven aquí tal como estaban en la ruta. La diferencia
importante es el `try/catch` que envuelve todo: este módulo se va a invocar sin `await` en la
Tarea 2, y una promesa desatendida que rechaza produce un unhandled rejection capaz de tumbar
el proceso.

```ts
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
```

- [ ] **Step 7: Correr la prueba y verificar que pasa**

Run: `npm test`
Expected: PASS — 3 pruebas

- [ ] **Step 8: Hacer que la ruta use el módulo, todavía con await**

En `src/app/[keyword]/route.ts`, reemplazar el bloque de `fetchGeo` y `logTask` por una
llamada al módulo nuevo. **En este paso se mantiene el `await`**: la Tarea 2 lo quita. Así
este commit no cambia ningún comportamiento observable y es fácil de revisar.

Añadir el import:

```ts
import { registrarClic } from '@/lib/click-tracking';
```

Borrar las declaraciones de `type Geo`, `fetchGeo` y `logTask`, y dejar:

```ts
    const updateClicks = prisma.url.update({
      where: { keyword },
      data: { clicks: { increment: 1 } },
    });

    await Promise.all([
      updateClicks,
      registrarClic(keyword, { ip, userAgent, referrer, browser, os, device }),
    ]);
```

- [ ] **Step 9: Verificar que el proyecto compila y las pruebas pasan**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: sin errores nuevos, 3 pruebas en verde

- [ ] **Step 10: Commit**

```bash
git checkout -b feat/integracion-cotizador
git add vitest.config.ts package.json package-lock.json src/lib/click-tracking.ts src/lib/click-tracking.test.ts "src/app/[keyword]/route.ts"
git commit -m "refactor: extrae el registro de clic a src/lib/click-tracking y añade Vitest

El registro estaba incrustado en la ruta de redirección y no se podía probar
sin levantar Next. El módulo nuevo nunca lanza, porque la tarea siguiente lo
va a invocar sin await y una promesa desatendida que rechaza puede tumbar el
proceso.

Sin cambio de comportamiento: la ruta sigue esperando el registro."
```

---

### Task 2: Desbloquear la redirección

Hoy la ruta espera el registro completo antes de responder, y ese registro incluye una
llamada HTTP a `ip-api.com`. Cada visitante espera un viaje de ida y vuelta a un tercero
antes de recibir el redirect; si el servicio está lento o agotó su cuota gratuita de 45
peticiones por minuto, el link tarda segundos en abrir.

El incremento de `clicks` se mantiene esperado: es un `UPDATE` de una fila y garantiza que el
contador sea exacto. Lo que se desacopla es la geolocalización y el `Log`. Un log perdido por
un reinicio es aceptable — es analítica, no contabilidad.

**Files:**
- Modify: `src/app/[keyword]/route.ts`
- Create: `src/app/[keyword]/route.test.ts`

**Interfaces:**
- Consumes: `registrarClic` de la Tarea 1
- Produces: nada nuevo; cambia el comportamiento temporal de `GET /[keyword]`

- [ ] **Step 1: Escribir la prueba que falla**

La prueba demuestra lo que importa: la ruta responde aunque el registro nunca termine.

Crear `src/app/[keyword]/route.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npm test src/app/`
Expected: FAIL — "la ruta esperó el registro del clic"

- [ ] **Step 3: Quitar el await del registro**

En `src/app/[keyword]/route.ts`, reemplazar el bloque de la Tarea 1 por:

```ts
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
```

- [ ] **Step 4: Correr las pruebas y verificar que pasan**

Run: `npm test`
Expected: PASS — 6 pruebas (3 de la Tarea 1 y 3 de esta)

- [ ] **Step 5: Verificar a mano contra un link real**

Run: `npm run dev` y en otra terminal, con un keyword que exista en la base de desarrollo:

```bash
time curl -sI http://localhost:3000/<keyword> | head -3
```

Expected: `HTTP/1.1 307`, y el tiempo total por debajo de 100 ms. Antes de este cambio
incluía el viaje a `ip-api.com`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[keyword]/route.ts" "src/app/[keyword]/route.test.ts"
git commit -m "perf: la redirección deja de esperar la geolocalización

Cada clic esperaba un fetch a ip-api.com antes de recibir el redirect, por http
sin TLS y con la cuota gratuita de 45 req/min. El contador de clics se sigue
esperando porque debe ser exacto; el Log y la geolocalización se desacoplan.

Un log perdido por un reinicio es aceptable: es analítica, no contabilidad."
```

---

### Task 3: Autenticar el endpoint de estadísticas

`GET /api/v1/stats/[keyword]` no verifica nada: llama a `getKeywordStats(keyword)` y devuelve
clics, ciudades e IPs derivadas a quien adivine un keyword. En cuanto esos keywords apunten a
cotizaciones de clientes, eso es fuga de datos comerciales.

`getSession()` ya resuelve el header `x-api-key` contra la base (`src/lib/session.ts:70-82`),
así que el consumidor servidor a servidor no necesita nada nuevo.

**Files:**
- Modify: `src/app/api/v1/stats/[keyword]/route.ts`
- Create: `src/app/api/v1/stats/[keyword]/route.test.ts`

**Interfaces:**
- Consumes: `getSession()` de `@/lib/session`; `unauthorized()` y `forbidden()` de `@/lib/api-error`
- Produces: `GET /api/v1/stats/:keyword` responde 401 sin sesión y 403 a un dueño ajeno

- [ ] **Step 1: Escribir la prueba que falla**

Crear `src/app/api/v1/stats/[keyword]/route.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npm test src/app/api/v1/stats`
Expected: FAIL — devuelve 200 donde se esperaba 401

- [ ] **Step 3: Añadir la verificación a la ruta**

Reemplazar el contenido de `src/app/api/v1/stats/[keyword]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getKeywordStats } from '@/lib/stats';
import { forbidden, notFound, serverError, unauthorized } from '@/lib/api-error';

export async function GET(
  _request: Request,
  context: { params: Promise<{ keyword: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { keyword } = await context.params;

    // Se comprueba la propiedad antes de calcular nada: las estadísticas
    // incluyen ciudades e IPs derivadas y no deben salir a un tercero.
    const url = await prisma.url.findUnique({
      where: { keyword },
      select: { userId: true },
    });
    if (!url) return notFound('Keyword not found');
    if (session.role !== 'ADMIN' && url.userId !== session.id) return forbidden();

    const stats = await getKeywordStats(keyword);
    if (!stats) return notFound('Keyword not found');
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[stats]', error);
    return serverError();
  }
}
```

- [ ] **Step 4: Correr las pruebas y verificar que pasan**

Run: `npm test`
Expected: PASS — 11 pruebas

- [ ] **Step 5: Verificar que el panel del admin sigue funcionando**

Run: `npm run dev`, entrar con la sesión de admin y abrir `/admin/stats/<keyword>`.
Expected: las estadísticas cargan igual que antes. La página usa la sesión por cookie, que
`getSession()` también resuelve.

- [ ] **Step 6: Commit**

```bash
git add "src/app/api/v1/stats/[keyword]/route.ts" "src/app/api/v1/stats/[keyword]/route.test.ts"
git commit -m "fix: autentica GET /api/v1/stats/:keyword

La ruta devolvía clics, ciudades e IPs derivadas a quien adivinara un keyword.
Ahora exige sesión (cookie o x-api-key) y propiedad del link, salvo ADMIN.

Se comprueba la propiedad antes de calcular las estadísticas."
```

---

### Task 4: Firma HMAC de webhooks

Módulo puro, sin red ni base de datos, para poder probar la firma exhaustivamente. La Tarea 5
lo usa para emitir.

El detalle que decide la corrección: **se firma exactamente la cadena que se envía**. Si se
firmara un objeto y luego se serializara aparte, cualquier diferencia de orden de claves
rompería la verificación en el receptor.

**Files:**
- Create: `src/lib/webhook.ts`
- Create: `src/lib/webhook.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `firmar(cuerpoCrudo: string, secreto: string, timestamp: number): string` — devuelve `sha256=<hex>`
  - `verificar(cuerpoCrudo: string, secreto: string, timestamp: number, firmaRecibida: string, toleranciaSegundos?: number, ahoraSegundos?: number): boolean` — el último parámetro existe para que las pruebas fijen el reloj; en producción se omite

- [ ] **Step 1: Escribir la prueba que falla**

Crear `src/lib/webhook.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { firmar, verificar } from '@/lib/webhook';

const SECRETO = 'whsec_prueba_123';
const CUERPO = '{"event":"link.clicked","keyword":"x7k2"}';
const AHORA = 1_789_000_000;

describe('firmar', () => {
  it('produce una firma con el prefijo del algoritmo', () => {
    expect(firmar(CUERPO, SECRETO, AHORA)).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('es determinista', () => {
    expect(firmar(CUERPO, SECRETO, AHORA)).toBe(firmar(CUERPO, SECRETO, AHORA));
  });

  it('cambia si cambia el timestamp', () => {
    expect(firmar(CUERPO, SECRETO, AHORA)).not.toBe(firmar(CUERPO, SECRETO, AHORA + 1));
  });

  it('cambia si cambia el secreto', () => {
    expect(firmar(CUERPO, SECRETO, AHORA)).not.toBe(firmar(CUERPO, 'otro', AHORA));
  });
});

describe('verificar', () => {
  it('acepta una firma válida y reciente', () => {
    const firma = firmar(CUERPO, SECRETO, AHORA);
    expect(verificar(CUERPO, SECRETO, AHORA, firma, 300, AHORA)).toBe(true);
  });

  it('rechaza un cuerpo alterado', () => {
    const firma = firmar(CUERPO, SECRETO, AHORA);
    const alterado = '{"event":"link.clicked","keyword":"otro"}';
    expect(verificar(alterado, SECRETO, AHORA, firma, 300, AHORA)).toBe(false);
  });

  it('rechaza una firma alterada', () => {
    const firma = firmar(CUERPO, SECRETO, AHORA).replace(/.$/, '0');
    expect(verificar(CUERPO, SECRETO, AHORA, firma, 300, AHORA)).toBe(false);
  });

  it('rechaza un secreto distinto', () => {
    const firma = firmar(CUERPO, 'otro', AHORA);
    expect(verificar(CUERPO, SECRETO, AHORA, firma, 300, AHORA)).toBe(false);
  });

  it('rechaza un timestamp vencido', () => {
    const firma = firmar(CUERPO, SECRETO, AHORA);
    expect(verificar(CUERPO, SECRETO, AHORA, firma, 300, AHORA + 301)).toBe(false);
  });

  it('rechaza un timestamp del futuro fuera de tolerancia', () => {
    const firma = firmar(CUERPO, SECRETO, AHORA);
    expect(verificar(CUERPO, SECRETO, AHORA, firma, 300, AHORA - 301)).toBe(false);
  });

  it('rechaza una firma con formato inválido sin lanzar', () => {
    expect(verificar(CUERPO, SECRETO, AHORA, 'basura', 300, AHORA)).toBe(false);
    expect(verificar(CUERPO, SECRETO, AHORA, '', 300, AHORA)).toBe(false);
    expect(verificar(CUERPO, SECRETO, AHORA, 'sha256=corta', 300, AHORA)).toBe(false);
  });
});
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npm test src/lib/webhook`
Expected: FAIL — `Cannot find module '@/lib/webhook'`

- [ ] **Step 3: Crear `src/lib/webhook.ts`**

```ts
import crypto from 'node:crypto';

/**
 * Firma el cuerpo EXACTO que se va a enviar, junto al timestamp.
 * Incluir el timestamp en el material firmado es lo que impide reenviar
 * una petición interceptada con un timestamp nuevo.
 */
export function firmar(cuerpoCrudo: string, secreto: string, timestamp: number): string {
  const material = `${timestamp}.${cuerpoCrudo}`;
  const hmac = crypto.createHmac('sha256', secreto).update(material, 'utf8').digest('hex');
  return `sha256=${hmac}`;
}

export function verificar(
  cuerpoCrudo: string,
  secreto: string,
  timestamp: number,
  firmaRecibida: string,
  toleranciaSegundos = 300,
  ahoraSegundos = Math.floor(Date.now() / 1000),
): boolean {
  if (Math.abs(ahoraSegundos - timestamp) > toleranciaSegundos) return false;

  const esperada = firmar(cuerpoCrudo, secreto, timestamp);
  const a = Buffer.from(esperada, 'utf8');
  const b = Buffer.from(firmaRecibida, 'utf8');

  // timingSafeEqual exige longitudes iguales, y comparar longitudes antes no
  // filtra nada útil: la longitud de la firma es fija y pública.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Correr las pruebas y verificar que pasan**

Run: `npm test`
Expected: PASS — 22 pruebas

- [ ] **Step 5: Commit**

```bash
git add src/lib/webhook.ts src/lib/webhook.test.ts
git commit -m "feat: firma HMAC para webhooks salientes

Módulo puro y sin dependencias para poder probar la firma a fondo. Se firma la
cadena exacta que se envía, junto al timestamp: firmar un objeto y serializarlo
aparte rompería la verificación ante cualquier diferencia de orden de claves.

El timestamp va dentro del material firmado para impedir reenvíos."
```

---

### Task 5: Emitir el webhook de clic

El consumidor se configura **por usuario, no por link**: la `ApiKey` ya pertenece a un
`User`, así que el cotizador se autentica como uno y no hay que configurar nada en cada
enlace.

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_webhook_por_usuario/migration.sql` (generada)
- Modify: `src/lib/click-tracking.ts`
- Modify: `src/lib/click-tracking.test.ts`

**Interfaces:**
- Consumes: `firmar` de la Tarea 4; `registrarClic` de la Tarea 1
- Produces: `User.webhookUrl` y `User.webhookSecret`; `registrarClic` emite el webhook tras crear el `Log`

- [ ] **Step 1: Añadir las columnas al schema**

En `prisma/schema.prisma`, dentro de `model User`, junto a `role`:

```prisma
  webhookUrl    String?
  webhookSecret String?
```

- [ ] **Step 2: Generar y aplicar la migración**

```bash
npx prisma migrate dev --name webhook_por_usuario
```

Expected: crea la migración y regenera el cliente. Ambas columnas son opcionales, así que no
puede fallar por datos existentes.

- [ ] **Step 3: Escribir la prueba que falla**

Añadir al final de `src/lib/click-tracking.test.ts`, y ampliar el mock de prisma del inicio
del archivo para incluir `url.findUnique`:

En el `vi.mock('@/lib/prisma', ...)` del inicio, añadir dentro de `url`:

```ts
      findUnique: (...args: unknown[]) => urlFindUnique(...args),
```

y declarar arriba, junto a los otros mocks:

```ts
const urlFindUnique = vi.fn();
```

Luego añadir el bloque de pruebas:

```ts
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
```

- [ ] **Step 4: Correr la prueba y verificar que falla**

Run: `npm test src/lib/click-tracking`
Expected: FAIL — `fetchMock` no fue llamado

- [ ] **Step 5: Emitir el webhook desde `registrarClic`**

En `src/lib/click-tracking.ts`, añadir el import y la función de emisión, y llamarla al final
de `registrarClic`:

```ts
import { firmar } from '@/lib/webhook';
```

```ts
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
```

Y al final del `try` de `registrarClic`, tras el `prisma.log.create`:

```ts
    await emitirWebhook(keyword, geo, meta);
```

- [ ] **Step 6: Correr todas las pruebas y verificar que pasan**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: PASS — 25 pruebas, sin errores de tipos ni de lint

- [ ] **Step 7: Verificar de punta a punta contra un receptor de prueba**

En una terminal:

```bash
npx --yes http-echo-server 9099
```

En la base de desarrollo, configurar el webhook del usuario dueño de un keyword:

```bash
npx prisma studio
```

Poner `webhookUrl = http://localhost:9099` y `webhookSecret = whsec_prueba` en ese `User`.
Luego `npm run dev` y visitar `http://localhost:3000/<keyword>`.

Expected: el echo server imprime el POST con las cabeceras `X-Yourls-Signature` y
`X-Yourls-Timestamp`, el cuerpo **no** contiene la IP del visitante, y el redirect se sirvió
igual de rápido que en la Tarea 2.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/click-tracking.ts src/lib/click-tracking.test.ts
git commit -m "feat: webhook de clic firmado, configurado por usuario

User gana webhookUrl y webhookSecret: la ApiKey ya pertenece a un User, así que
el consumidor se configura una vez y no en cada enlace.

El payload NO incluye la IP del visitante: el receptor no la necesita y lo que
no se envía no se puede filtrar. Entrega best-effort con timeout de 3s, sin
reintentos ni cola, porque la API de estadísticas sigue siendo la fuente de
verdad. Un webhook que falla no impide registrar el clic."
```

---

## Cierre

- [ ] **Correr la suite completa y el lint**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: todo en verde

- [ ] **Abrir el PR**

```bash
git push -u origin feat/integracion-cotizador
gh pr create --title "Integración con el Cotizador: redirección sin bloqueo, stats autenticado y webhook firmado" --body "Implementa docs/plans/2026-09-17-integracion-cotizador.md"
```

## Criterios de aceptación del plan

Verificables sin conocer el código:

1. `time curl -sI http://localhost:3000/<keyword>` responde en menos de 100 ms y no depende de `ip-api.com`
2. `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/v1/stats/<keyword>` devuelve `401`
3. La misma petición con `-H "x-api-key: <clave válida del dueño>"` devuelve `200`
4. Con la clave de otro usuario devuelve `403`
5. Un POST al receptor con la firma alterada en un carácter es rechazado
6. El cuerpo del webhook no contiene la IP del visitante
7. `npm test` pasa con 25 pruebas

## Deuda observada, fuera de alcance

Se detectó al leer el repositorio y **no se toca en este plan**:

- `.github/workflows/ci.yml` es el CI del **YOURLS original en PHP**: matriz de PHP 8.1 a 8.6,
  servicio MariaDB y `--coverage-clover`. No prueba nada de este código Node
- `.github/workflows/update-geoip.yml` sugiere una base GeoIP local que no existe: no hay
  ningún `.mmdb` en el repositorio y el código usa `ip-api.com`. Reemplazar el tercero por una
  base local quitaría la llamada externa y el envío de IP en claro
- Los links protegidos con contraseña **no registran clics**: `src/app/[keyword]/route.ts`
  redirige a `/protected/:keyword` y retorna antes de registrar
- `data/mind.db-wal` y `data/mind.db-shm` están versionados en un repositorio público. El
  `.gitignore` cubre `*.db` y `*.db-journal` pero no `-shm` ni `-wal`
- `.git` pesa 401 MB

## Requisito de despliegue detectado en la verificación

**Este repositorio no usa migraciones de Prisma.** No existe `prisma/migrations/` ni script
de migración: el schema se aplica con `prisma db push`. La Tarea 5 añade `webhookUrl` y
`webhookSecret` a `User`, así que **antes de desplegar** hay que correr contra la base de
Railway:

```bash
DATABASE_URL="<url de produccion>" npx prisma db push
```

Si se despliega sin eso, el modo de fallo es **silencioso**: `emitirWebhook` selecciona esas
dos columnas, Prisma lanza porque no existen, y el `try/catch` del módulo se traga el error.
Los clics se siguen registrando con normalidad y los webhooks simplemente nunca salen, sin
nada en rojo que lo delate.
