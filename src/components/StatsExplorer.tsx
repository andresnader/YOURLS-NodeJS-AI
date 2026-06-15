"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  BarChart3,
  ExternalLink,
  Globe,
  Lock,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import Pagination from "./Pagination";
import { useToast } from "./Toast";

interface StatLink {
  keyword: string;
  url: string;
  title: string | null;
  favicon: string | null;
  isHealthy: boolean;
  clicks: number;
  rangeClicks: number;
  createdAt: string;
  redirectType?: number;
  hasPassword?: boolean;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const RANGES = [
  { value: "24h", label: "24 h" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "all", label: "Histórico" },
] as const;

const PAGE_SIZES = [10, 25, 50, 100];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Fecha" },
  { value: "clicks", label: "Clics" },
  { value: "keyword", label: "Palabra clave" },
];

const RANGE_COL_LABEL: Record<string, string> = {
  "24h": "Clics 24 h",
  "7d": "Clics 7 días",
  "30d": "Clics 30 días",
  "90d": "Clics 90 días",
  all: "Clics",
};

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function StatsExplorer() {
  const { toast } = useToast();
  const [links, setLinks] = useState<StatLink[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<string>("7d");
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          search,
          sortBy,
          sortOrder,
          range,
        });
        const res = await fetch(`/api/stats/links?${params}`);
        const data = await res.json();
        setLinks(data.data || []);
        setPagination(
          data.pagination || { page: 1, limit, total: 0, totalPages: 0 },
        );
      } catch {
        toast("No se pudieron cargar las estadísticas", "error");
      } finally {
        setLoading(false);
      }
    },
    [limit, search, sortBy, sortOrder, range, toast],
  );

  // Fetch on mount + whenever filters change (debounced when searching).
  useEffect(() => {
    const timer = setTimeout(() => fetchLinks(1), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchLinks, search]);

  const exportUrl = () => {
    const params = new URLSearchParams({ search, range });
    return `/api/stats/links/export?${params}`;
  };

  const showRangeCol = range !== "all";

  return (
    <div className="space-y-5">
      {/* Toolbar: search + range + page size + export */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por palabra clave, URL o título…"
              className="input-glass pl-10 text-sm w-full"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-glass text-sm appearance-none cursor-pointer"
              style={{ minWidth: "150px" }}
              aria-label="Ordenar por"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Ordenar: {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="btn-ghost text-xs px-3 whitespace-nowrap"
              title={sortOrder === "desc" ? "Descendente" : "Ascendente"}
            >
              <ArrowUpDown size={14} strokeWidth={1.75} />
              {sortOrder === "desc" ? "Desc" : "Asc"}
            </button>
          </div>

          {/* Export */}
          <a
            href={exportUrl()}
            download
            className="btn-ghost text-[13px] inline-flex items-center gap-2 justify-center whitespace-nowrap"
          >
            <Download size={14} strokeWidth={1.75} />
            Exportar CSV
          </a>
        </div>

        {/* Range filter + page size */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            className="inline-flex p-0.5 self-start"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {RANGES.map((r) => {
              const selected = r.value === range;
              return (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className="px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer"
                  style={{
                    background: selected ? "var(--bg-surface)" : "transparent",
                    color: selected
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                    borderRadius: "calc(var(--radius-md) - 2px)",
                    boxShadow: selected ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              Por página
            </span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="input-glass text-sm appearance-none cursor-pointer py-1.5"
              style={{ minWidth: "72px" }}
              aria-label="Enlaces por página"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading && links.length === 0 ? (
        <div
          className="p-16 text-center border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <Loader2
            className="animate-spin h-6 w-6 mx-auto mb-4"
            style={{ color: "var(--color-primary)" }}
          />
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            Cargando estadísticas…
          </p>
        </div>
      ) : links.length === 0 ? (
        <div
          className="p-16 text-center border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <Globe
            size={36}
            strokeWidth={1.5}
            className="mx-auto mb-5"
            style={{ color: "var(--text-muted)" }}
          />
          <p
            className="font-serif text-[22px]"
            style={{ color: "var(--text-primary)" }}
          >
            Sin resultados
          </p>
          <p className="text-[14px] mt-2" style={{ color: "var(--text-muted)" }}>
            {search
              ? "Prueba con otra búsqueda."
              : "Aún no hay enlaces que mostrar."}
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden border animate-fade-in"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th
                    className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Enlace
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-[0.1em] hidden md:table-cell"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Destino
                  </th>
                  {showRangeCol && (
                    <th
                      className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-[0.1em] whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {RANGE_COL_LABEL[range]}
                    </th>
                  )}
                  <th
                    className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Clics totales
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-[0.1em] hidden lg:table-cell"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Creado
                  </th>
                  <th
                    className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody>
                {links.map((item) => (
                  <tr
                    key={item.keyword}
                    className="group transition-colors cursor-pointer"
                    style={{ borderBottom: "1px solid var(--border-soft)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-elevated)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* Short link */}
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        {item.favicon ? (
                          <img
                            src={item.favicon}
                            alt=""
                            className="w-5 h-5 rounded mt-0.5 shrink-0"
                          />
                        ) : (
                          <div
                            className="w-5 h-5 rounded mt-0.5 shrink-0 flex items-center justify-center"
                            style={{ background: "var(--bg-hover)" }}
                          >
                            <Globe
                              size={10}
                              style={{ color: "var(--text-muted)" }}
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1.5">
                            <Link
                              href={`/admin/stats/${item.keyword}`}
                              className="font-mono text-[13px] inline-flex items-center gap-1 hover:underline"
                              style={{ color: "var(--color-primary)" }}
                            >
                              /{item.keyword}
                            </Link>
                            {item.hasPassword && (
                              <Lock
                                size={11}
                                strokeWidth={1.75}
                                style={{ color: "var(--text-muted)" }}
                                aria-label="Protegido con contraseña"
                              />
                            )}
                            {!item.isHealthy && (
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: "var(--color-danger)" }}
                                title="Enlace caído"
                              />
                            )}
                          </span>
                          <p
                            className="text-[13px] truncate mt-0.5"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.title || (
                              <span style={{ color: "var(--text-muted)" }}>
                                Sin título
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[13px] truncate max-w-[280px] inline-flex items-center gap-1 hover:underline"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span className="truncate">{item.url}</span>
                        <ExternalLink
                          size={11}
                          strokeWidth={1.75}
                          className="shrink-0"
                        />
                      </a>
                    </td>

                    {/* Range clicks */}
                    {showRangeCol && (
                      <td className="px-5 py-4 text-right">
                        <span
                          className="font-mono text-[13px] tabular-nums"
                          style={{
                            color:
                              item.rangeClicks > 0
                                ? "var(--color-primary)"
                                : "var(--text-muted)",
                          }}
                        >
                          {item.rangeClicks.toLocaleString()}
                        </span>
                      </td>
                    )}

                    {/* Total clicks */}
                    <td className="px-5 py-4 text-right">
                      <span
                        className="font-mono text-[13px] tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.clicks.toLocaleString()}
                      </span>
                    </td>

                    {/* Created */}
                    <td
                      className="px-5 py-4 hidden lg:table-cell text-[13px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {fechaCorta(item.createdAt)}
                    </td>

                    {/* Detail link */}
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/stats/${item.keyword}`}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--text-primary)";
                          e.currentTarget.style.background = "var(--bg-hover)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-secondary)";
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <BarChart3 size={13} strokeWidth={1.75} />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer: total + pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          {pagination.total.toLocaleString()} enlace
          {pagination.total !== 1 ? "s" : ""} en total
        </span>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(p) => fetchLinks(p)}
        />
      </div>
    </div>
  );
}
