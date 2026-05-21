/**
 * DEPRECATED alias. Use /api/v1/keys.
 */
import { keysGet, keysPost, keysDelete } from '@/lib/handlers/keys-handler';

const DEPRECATION_HEADERS = {
  Deprecation: 'true',
  Sunset: 'Wed, 31 Dec 2026 23:59:59 GMT',
  Link: '</api/v1/keys>; rel="successor-version"',
};

function addDeprecation(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(DEPRECATION_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export async function GET() {
  return addDeprecation(await keysGet());
}

export async function POST(request: Request) {
  return addDeprecation(await keysPost(request));
}

export async function DELETE(request: Request) {
  return addDeprecation(await keysDelete(request));
}
