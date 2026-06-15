/**
 * MCP (Model Context Protocol) endpoint — Streamable HTTP transport.
 *
 * A minimal, dependency-free JSON-RPC 2.0 server that lets AI agents (Claude
 * Desktop, etc.) manage short links and read analytics. Authenticated with the
 * same API keys used by the REST API, via the `x-api-key` header or
 * `Authorization: Bearer <key>`.
 *
 * Supported methods: initialize, notifications/initialized, ping, tools/list,
 * tools/call. Each tool request gets a single JSON (application/json) response,
 * which is compliant with the Streamable HTTP spec for servers that don't open
 * an SSE stream.
 */
import { lookupApiKey } from '@/lib/api-key';
import { listMcpTools, callMcpTool, type McpToolContext } from '@/lib/mcp';
import type { SessionPayload } from '@/lib/session';

export const dynamic = 'force-dynamic';

const SERVER_INFO = { name: 'yourls-node-mcp', version: '0.1.0' };
const DEFAULT_PROTOCOL_VERSION = '2025-06-18';

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

function rpcResult(id: string | number | null, result: unknown) {
  return { jsonrpc: '2.0' as const, id, result };
}

function rpcError(id: string | number | null, code: number, message: string) {
  return { jsonrpc: '2.0' as const, id, error: { code, message } };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Read the API key from x-api-key or an Authorization: Bearer header. */
function extractApiKey(request: Request): string | null {
  const direct = request.headers.get('x-api-key');
  if (direct) return direct.trim();
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return null;
}

function baseUrlFrom(request: Request): string {
  const h = request.headers;
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/** Handle a single JSON-RPC message. Returns null for notifications. */
async function handleMessage(
  msg: JsonRpcRequest,
  ctx: McpToolContext,
): Promise<object | null> {
  const id = msg.id ?? null;

  switch (msg.method) {
    case 'initialize': {
      const requested =
        (msg.params?.protocolVersion as string) || DEFAULT_PROTOCOL_VERSION;
      return rpcResult(id, {
        protocolVersion: requested,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    }

    case 'ping':
      return rpcResult(id, {});

    case 'tools/list':
      return rpcResult(id, { tools: listMcpTools() });

    case 'tools/call': {
      const name = msg.params?.name as string;
      const args = (msg.params?.arguments as Record<string, unknown>) || {};
      if (!name) return rpcError(id, -32602, 'Falta el nombre de la herramienta');
      const result = await callMcpTool(name, args, ctx);
      return rpcResult(id, result);
    }

    default:
      // Notifications (no id) we don't act on are simply acknowledged.
      if (msg.method?.startsWith('notifications/')) return null;
      if (id === null) return null;
      return rpcError(id, -32601, `Método no encontrado: ${msg.method}`);
  }
}

export async function POST(request: Request): Promise<Response> {
  // ── Authenticate with an API key ──
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return json(
      rpcError(null, -32001, 'No autorizado: falta la API key (x-api-key o Bearer)'),
      401,
    );
  }
  const auth = await lookupApiKey(apiKey);
  if (!auth) {
    return json(rpcError(null, -32001, 'No autorizado: API key inválida'), 401);
  }

  const session: SessionPayload = {
    id: auth.userId,
    username: auth.username,
    role: auth.role,
    exp: Math.floor(Date.now() / 1000) + 60,
    isApiKey: true,
  };
  const ctx: McpToolContext = {
    session,
    ip: clientIp(request),
    baseUrl: baseUrlFrom(request),
  };

  // ── Parse JSON-RPC body (single or batch) ──
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(rpcError(null, -32700, 'JSON inválido'), 400);
  }

  if (Array.isArray(payload)) {
    const responses = (
      await Promise.all(
        payload.map((m) => handleMessage(m as JsonRpcRequest, ctx)),
      )
    ).filter((r): r is object => r !== null);
    // If everything was a notification, acknowledge with 202 and no body.
    if (responses.length === 0) return new Response(null, { status: 202 });
    return json(responses);
  }

  const response = await handleMessage(payload as JsonRpcRequest, ctx);
  if (response === null) return new Response(null, { status: 202 });
  return json(response);
}

// The Streamable HTTP spec uses GET to open a server→client SSE stream. This
// MVP doesn't push server-initiated messages, so we decline it.
export async function GET(): Promise<Response> {
  return new Response('Method Not Allowed', { status: 405 });
}
