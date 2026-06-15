"use client";

import { Search, SlidersHorizontal } from "lucide-react";

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
}

export default function SearchFilter({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full animate-fade-in">
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
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por palabra clave, URL o título…"
          className="input-glass pl-10 text-sm"
        />
      </div>

      {/* Sort */}
      <div className="flex gap-2">
        <div className="relative">
          <SlidersHorizontal
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="input-glass pl-8 pr-3 text-sm appearance-none cursor-pointer"
            style={{ minWidth: "140px" }}
          >
            <option value="createdAt">Fecha</option>
            <option value="clicks">Clics</option>
            <option value="keyword">Palabra clave</option>
          </select>
        </div>
        <button
          onClick={() => onSortOrderChange(sortOrder === "desc" ? "asc" : "desc")}
          className="btn-ghost text-xs px-3 rounded-lg whitespace-nowrap"
          title={sortOrder === "desc" ? "Más recientes primero" : "Más antiguos primero"}
        >
          {sortOrder === "desc" ? "↓ Desc" : "↑ Asc"}
        </button>
      </div>
    </div>
  );
}
