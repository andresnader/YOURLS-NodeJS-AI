/**
 * MCP tool registry for the YOURLS-Node link shortener.
 *
 * Each tool wraps existing, battle-tested business logic (shortenUrl,
 * getKeywordStats, Prisma queries) and is exposed over the MCP endpoint at
 * /api/mcp. Tools are scoped to the authenticated API key's owner: a non-admin
 * key only ever sees and creates its own links; an admin key sees everything.
 */
import prisma from '@/lib/prisma';
import { shortenUrl } from '@/lib/shorten';
import { ShortenRequest } from '@/lib/schemas';
import { getKeywordStats, type TimeRange } from '@/lib/stats';
import type { SessionPayload } from '@/lib/session';

export type McpToolContext = {
  session: SessionPayload;
  ip: string;
  /** Public base URL used to build full short links, e.g. https://ameiz.in */
  baseUrl: string;
};

export type McpToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

type JsonSchema = Record<string, unknown>;

type ToolDef = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  handler: (args: Record<string, unknown>, ctx: McpToolContext) => Promise<unknown>;
};

const VALID_RANGES: TimeRange[] = ['24h', '7d', '30d', '90d', 'all'];

/** Owner scope: admins see everything, regular keys only their own links. */
function ownerWhere(ctx: McpToolContext): Record<string, unknown> {
  return ctx.session.role === 'ADMIN' ? {} : { userId: ctx.session.id };
}

/** Top-N entries of a {label: count} map as a tidy array. */
function topN(map: Record<string, number>, n = 5): { name: string; clicks: number }[] {
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([name, clicks]) => ({ name, clicks }));
}

const TOOLS: ToolDef[] = [
  {
    name: 'shorten_url',
    description:
      'Crea un enlace corto nuevo a partir de una URL larga. Devuelve el enlace corto completo listo para compartir. Opcionalmente acepta una palabra clave personalizada y un título.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'La URL larga de destino (debe incluir https://).',
        },
        keyword: {
          type: 'string',
          description:
            'Palabra clave personalizada opcional (solo letras, números, guion y guion bajo). Si se omite, se genera una automáticamente.',
        },
        title: {
          type: 'string',
          description: 'Título opcional para identificar el enlace.',
        },
        redirectType: {
          type: 'number',
          enum: [301, 302, 307],
          description:
            'Tipo de redirección: 301 permanente (recomendado), 302/307 temporal. Por defecto 302.',
        },
      },
      required: ['url'],
    },
    handler: async (args, ctx) => {
      const parsed = ShortenRequest.safeParse({
        url: args.url,
        customKeyword: args.keyword,
        title: args.title,
        redirectType: args.redirectType,
      });
      if (!parsed.success) {
        throw new Error(
          parsed.error.issues.map((i) => i.message).join('; ') || 'Datos inválidos',
        );
      }

      const result = await shortenUrl(parsed.data, ctx.session, ctx.ip);
      if (!result.ok) {
        const messages: Record<string, string> = {
          blacklisted: 'El dominio está en la lista negra.',
          reserved: 'Esa palabra clave está reservada para el sistema.',
          invalid_keyword: 'La palabra clave no es válida.',
          conflict: 'Esa palabra clave ya está en uso.',
        };
        throw new Error(messages[result.error.type] || 'No se pudo crear el enlace.');
      }

      return {
        shortUrl: `${ctx.baseUrl}/${result.data.keyword}`,
        keyword: result.data.keyword,
        destination: result.data.url,
        title: result.data.title,
        redirectType: result.data.redirectType,
      };
    },
  },

  {
    name: 'list_links',
    description:
      'Lista los enlaces cortos con paginación y búsqueda opcional por palabra clave, URL o título. Útil para encontrar enlaces o revisar cuáles existen.',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Texto a buscar en palabra clave, URL o título.',
        },
        limit: {
          type: 'number',
          description: 'Cantidad de enlaces por página (1-100). Por defecto 25.',
        },
        page: { type: 'number', description: 'Número de página (desde 1). Por defecto 1.' },
      },
    },
    handler: async (args, ctx) => {
      const limit = Math.min(100, Math.max(1, Number(args.limit) || 25));
      const page = Math.max(1, Number(args.page) || 1);
      const search = typeof args.search === 'string' ? args.search.trim() : '';

      const where: Record<string, unknown> = ownerWhere(ctx);
      if (search) {
        where.OR = [
          { keyword: { contains: search, mode: 'insensitive' } },
          { url: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [rows, total] = await Promise.all([
        prisma.url.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            keyword: true,
            url: true,
            title: true,
            clicks: true,
            createdAt: true,
          },
        }),
        prisma.url.count({ where }),
      ]);

      return {
        links: rows.map((r) => ({
          shortUrl: `${ctx.baseUrl}/${r.keyword}`,
          keyword: r.keyword,
          destination: r.url,
          title: r.title,
          clicks: r.clicks,
          createdAt: r.createdAt.toISOString(),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    },
  },

  {
    name: 'get_link_stats',
    description:
      'Devuelve las estadísticas de un enlace corto: clics totales, clics en el periodo, y los principales países, referentes, navegadores y dispositivos.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'La palabra clave del enlace (sin la barra inicial).',
        },
        range: {
          type: 'string',
          enum: ['24h', '7d', '30d', '90d', 'all'],
          description: 'Periodo de tiempo. Por defecto 7d.',
        },
      },
      required: ['keyword'],
    },
    handler: async (args, ctx) => {
      const keyword = String(args.keyword || '').trim();
      if (!keyword) throw new Error('Falta la palabra clave.');

      const link = await prisma.url.findUnique({ where: { keyword } });
      if (!link || (ctx.session.role !== 'ADMIN' && link.userId !== ctx.session.id)) {
        throw new Error('No se encontró un enlace con esa palabra clave.');
      }

      const range: TimeRange = VALID_RANGES.includes(args.range as TimeRange)
        ? (args.range as TimeRange)
        : '7d';
      const stats = await getKeywordStats(keyword, range);
      if (!stats) throw new Error('No se encontraron estadísticas.');

      return {
        keyword: stats.keyword,
        destination: stats.longUrl,
        totalClicks: stats.totalClicks,
        clicksInRange: stats.rangeClicks,
        range: stats.range,
        topCountries: topN(stats.countries),
        topReferrers: topN(stats.referrers),
        topBrowsers: topN(stats.browsers),
        devices: topN(stats.devices),
      };
    },
  },

  {
    name: 'get_overview',
    description:
      'Resumen general de la cuenta: número total de enlaces, clics totales, enlaces creados hoy y clics de hoy.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args, ctx) => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const where = ownerWhere(ctx);
      const logScope =
        ctx.session.role === 'ADMIN' ? {} : { urlRel: { userId: ctx.session.id } };

      const [totalLinks, sum, linksToday, clicksToday] = await Promise.all([
        prisma.url.count({ where }),
        prisma.url.aggregate({ _sum: { clicks: true }, where }),
        prisma.url.count({ where: { ...where, createdAt: { gte: todayStart } } }),
        prisma.log.count({ where: { clickedAt: { gte: todayStart }, ...logScope } }),
      ]);

      return {
        totalLinks,
        totalClicks: sum._sum.clicks || 0,
        linksToday,
        clicksToday,
      };
    },
  },
];

/** Public tool definitions for the MCP `tools/list` response. */
export function listMcpTools() {
  return TOOLS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  }));
}

/** Execute a tool by name and wrap the outcome in MCP content. */
export async function callMcpTool(
  name: string,
  args: Record<string, unknown>,
  ctx: McpToolContext,
): Promise<McpToolResult> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Herramienta desconocida: ${name}` }],
      isError: true,
    };
  }

  try {
    const data = await tool.handler(args || {}, ctx);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return {
      content: [
        { type: 'text', text: error instanceof Error ? error.message : 'Error desconocido' },
      ],
      isError: true,
    };
  }
}
