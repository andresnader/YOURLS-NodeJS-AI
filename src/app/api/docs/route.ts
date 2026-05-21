/**
 * Interactive API reference rendered via Scalar (loaded from CDN).
 * Static HTML page — auth not required.
 */
const SCALAR_SCRIPT = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference';

const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>YOURLS Node API · Docs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>body{margin:0;background:#0a0a0f;color:#fff;font-family:system-ui,sans-serif}</style>
</head>
<body>
  <script id="api-reference" data-url="/api/v1/openapi.json"></script>
  <script src="${SCALAR_SCRIPT}"></script>
</body>
</html>`;

export const dynamic = 'force-static';

export function GET() {
  return new Response(HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Scoped CSP: allow Scalar CDN on this page only.
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
        "connect-src 'self' https://cdn.jsdelivr.net",
        "frame-ancestors 'none'",
        "base-uri 'self'",
      ].join('; '),
    },
  });
}
