"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6 animate-fade-in">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost p-2 rounded-lg disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>

      {getPageNumbers().map((p, idx) =>
        p === "..." ? (
          <span
            key={`dots-${idx}`}
            className="px-2 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            ⋯
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
            style={
              p === page
                ? {
                    background: "linear-gradient(135deg, #00F0FF, var(--color-primary-dim))",
                    color: "#040609",
                    boxShadow: "0 0 20px -5px rgba(0, 240, 255, 0.4)",
                    fontWeight: 700,
                  }
                : {
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-glass)",
                    background: "var(--glass-bg-light)",
                  }
            }
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost p-2 rounded-lg disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
