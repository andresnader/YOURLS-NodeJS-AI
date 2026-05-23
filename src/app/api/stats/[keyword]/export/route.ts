/**
 * CSV export of a keyword's click log. Used by the "Export CSV" button on
 * the admin keyword stats page. Authenticated via getSession() (cookie or
 * x-api-key), and limited to the same range options as the analytics view.
 */
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

const RANGE_DAYS: Record<string, number | null> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

function csvEscape(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ keyword: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { keyword } = await context.params;
  const rangeParam = new URL(request.url).searchParams.get("range") ?? "7d";
  const days = rangeParam in RANGE_DAYS ? RANGE_DAYS[rangeParam] : 7;
  const since =
    days === null ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const url = await prisma.url.findUnique({ where: { keyword } });
  if (!url) {
    return new Response(JSON.stringify({ error: "Keyword not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (session.role !== "ADMIN" && url.userId !== session.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const logs = await prisma.log.findMany({
    where: {
      shorturl: keyword,
      ...(since ? { clickedAt: { gte: since } } : {}),
    },
    orderBy: { clickedAt: "desc" },
    take: 50000,
  });

  const header = [
    "clicked_at",
    "country_code",
    "region",
    "city",
    "browser",
    "os",
    "device",
    "referrer",
    "user_agent",
    "ip_address",
  ].join(",");

  const lines = logs.map((log) =>
    [
      log.clickedAt.toISOString(),
      log.countryCode,
      log.region,
      log.city,
      log.browser,
      log.os,
      log.device,
      log.referrer,
      log.userAgent,
      log.ipAddress,
    ]
      .map(csvEscape)
      .join(","),
  );

  const body = [header, ...lines].join("\n") + "\n";
  const filename = `${keyword}-${rangeParam}.csv`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
