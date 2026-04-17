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
      toast("Failed to load links", "error");
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
    if (!confirm(`Delete ${selectedKeys.size} link(s) permanently?`)) return;

    try {
      const res = await fetch("/api/shorten", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: Array.from(selectedKeys) }),
      });
      if (res.ok) {
        toast(`Deleted ${selectedKeys.size} link(s)`, "success");
        setSelectedKeys(new Set());
        fetchUrls(pagination.page);
        router.refresh();
      } else {
        toast("Failed to delete links", "error");
      }
    } catch {
      toast("Network error", "error");
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
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl animate-slide-down"
          style={{
            background: "rgba(0, 240, 255, 0.04)",
            border: "1px solid rgba(0, 240, 255, 0.12)",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "#00F0FF" }}>
            {selectedKeys.size} selected
          </span>
          <button onClick={handleBulkDelete} className="btn-danger text-xs py-1.5 px-3">
            <Trash2 size={13} /> Delete Selected
          </button>
          <button
            onClick={() => setSelectedKeys(new Set())}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      {loading && urls.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center animate-fade-in">
          <div
            className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: "#00F0FF", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading transmissions…</p>
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
        <div className="flex items-center gap-4">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {pagination.total} total transmission{pagination.total !== 1 ? "s" : ""}
          </span>
        </div>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
