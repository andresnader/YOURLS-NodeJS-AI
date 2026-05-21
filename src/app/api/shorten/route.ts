/**
 * DEPRECATED alias. New clients should use /api/v1/shorten.
 * Kept for the WordPress plugin v1.4.x and existing integrations.
 */
import { shortenPost, shortenGetList, shortenDelete } from '@/lib/handlers/shorten-handler';

const DEPRECATION_HEADERS = {
  Deprecation: 'true',
  Sunset: 'Wed, 31 Dec 2026 23:59:59 GMT',
  Link: '</api/v1/shorten>; rel="successor-version"',
};

function addDeprecation(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(DEPRECATION_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export async function POST(request: Request) {
  return addDeprecation(await shortenPost(request));
}

export async function GET(request: Request) {
  return addDeprecation(await shortenGetList(request));
}

export async function DELETE(request: Request) {
  return addDeprecation(await shortenDelete(request));
}
