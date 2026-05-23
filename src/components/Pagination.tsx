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
    <div className="flex items-center justify-center gap-1 animate-fade-in">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost p-2 disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft size={15} strokeWidth={1.75} />
      </button>

      {getPageNumbers().map((p, idx) =>
        p === "..." ? (
          <span
            key={`dots-${idx}`}
            className="px-2 text-[13px]"
            style={{ color: "var(--text-muted)" }}
          >
            ⋯
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className="w-9 h-9 text-[13px] cursor-pointer transition-colors border"
            style={
              p === page
                ? {
                    background: "var(--color-primary)",
                    color: "#FFFFFF",
                    borderColor: "var(--color-primary)",
                    fontWeight: 600,
                    borderRadius: "var(--radius-md)",
                  }
                : {
                    color: "var(--text-secondary)",
                    borderColor: "var(--border)",
                    background: "var(--bg-surface)",
                    borderRadius: "var(--radius-md)",
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
        className="btn-ghost p-2 disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight size={15} strokeWidth={1.75} />
      </button>
    </div>
  );
}
