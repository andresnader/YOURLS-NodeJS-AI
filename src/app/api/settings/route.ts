/** DEPRECATED alias. Use /api/v1/settings. */
import { settingsGet, settingsPost } from '@/lib/handlers/settings-handler';

const DEPRECATION_HEADERS = {
  Deprecation: 'true',
  Sunset: 'Wed, 31 Dec 2026 23:59:59 GMT',
  Link: '</api/v1/settings>; rel="successor-version"',
};

function addDeprecation(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(DEPRECATION_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export async function GET() {
  return addDeprecation(await settingsGet());
}

export async function POST(request: Request) {
  return addDeprecation(await settingsPost(request));
}
