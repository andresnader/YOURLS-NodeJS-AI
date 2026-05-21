/** DEPRECATED alias. Use /api/v1/export. */
import { exportGet } from '@/lib/handlers/export-handler';

export async function GET() {
  const res = await exportGet();
  const headers = new Headers(res.headers);
  headers.set('Deprecation', 'true');
  headers.set('Sunset', 'Wed, 31 Dec 2026 23:59:59 GMT');
  headers.set('Link', '</api/v1/export>; rel="successor-version"');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
