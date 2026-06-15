"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, Download } from "lucide-react";
import LinkTable from "./LinkTable";
import SearchFilter from "./SearchFilter";
import Pagination from "./Pagination";
import { useToast } from "./Toast";

interface UrlItem {
  keyword: string;
  url: string;
  title: string | null;
  favicon: string | null;
  isHealthy: boolean;
  clicks: number;
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

export default function AdminLinkManager() {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1, limit: 15, total: 0, totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const fetchUrls = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/shorten?${params}`);
      const data = await res.json();
      setUrls(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 0 });
    } catch {
      toast("No se pudieron cargar los enlaces", "error");
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder, toast]);

  // Auto-fetch on mount and whenever filters change
  useEffect(() => {
    const timer = setTimeout(() => fetchUrls(1), search ? 300 : 0); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchUrls]);

  // Listen for router refresh events (after create/delete/edit)
  useEffect(() => {
    fetchUrls(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Instant update when a new link is created
  useEffect(() => {
    const handleLinkCreated = (e: Event) => {
      const customEvent = e as CustomEvent<UrlItem>;
      if (customEvent.detail) {
        setUrls(prev => [customEvent.detail, ...prev]);
        setPagination(prev => ({
          ...prev,
          total: prev.total + 1
        }));
      }
    };

    window.addEventListener('link-created', handleLinkCreated);
    return () => window.removeEventListener('link-created', handleLinkCreated);
  }, []);

  const handlePageChange = (page: number) => {
    fetchUrls(page);
  };

  const toggleSelect = (keyword: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedKeys.size === urls.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(urls.map(u => u.keyword)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedKeys.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedKeys.size} enlace(s) de forma permanente?`)) return;

    try {
      const res = await fetch("/api/shorten", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: Array.from(selectedKeys) }),
      });
      if (res.ok) {
        toast(`${selectedKeys.size} enlace(s) eliminado(s)`, "success");
        setSelectedKeys(new Set());
        fetchUrls(pagination.page);
        router.refresh();
      } else {
        toast("No se pudieron eliminar los enlaces", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />
      </div>

      {/* Bulk actions bar */}
      {selectedKeys.size > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 animate-slide-down border"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
            {selectedKeys.size} seleccionado(s)
          </span>
          <button onClick={handleBulkDelete} className="btn-danger text-[12px] py-1.5 px-3">
            <Trash2 size={13} strokeWidth={1.75} /> Eliminar seleccionados
          </button>
          <button
            onClick={() => setSelectedKeys(new Set())}
            className="btn-ghost text-[12px] py-1.5 px-3"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Table */}
      {loading && urls.length === 0 ? (
        <div
          className="p-16 text-center animate-fade-in border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div
            className="animate-spin h-6 w-6 border-2 rounded-full mx-auto mb-4"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--color-primary)",
            }}
          />
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            Cargando enlaces…
          </p>
        </div>
      ) : (
        <LinkTable
          urls={urls}
          selectedKeys={selectedKeys}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          allSelected={urls.length > 0 && selectedKeys.size === urls.length}
        />
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          {pagination.total} enlace{pagination.total !== 1 ? "s" : ""} en total
        </span>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
