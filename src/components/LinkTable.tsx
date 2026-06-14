"use client";

import { useState } from "react";
import {
  ExternalLink,
  BarChart3,
  Copy,
  Edit2,
  Trash2,
  QrCode,
  Lock,
  Clock,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import Link from "next/link";
import { useTranslation } from "@/lib/LanguageContext";
import EditLinkModal from "./EditLinkModal";
import QrModal from "./QrModal";

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

interface LinkTableProps {
  urls: UrlItem[];
  selectedKeys: Set<string>;
  onToggleSelect: (keyword: string) => void;
  onSelectAll: () => void;
  allSelected: boolean;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function LinkTable({
  urls,
  selectedKeys,
  onToggleSelect,
  onSelectAll,
  allSelected,
}: LinkTableProps) {
  const [editingItem, setEditingItem] = useState<UrlItem | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleCopy = async (keyword: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${keyword}`);
      toast(t("common.success"), "success");
    } catch {
      toast(t("common.error"), "error");
    }
  };

  const handleDelete = async (keyword: string) => {
    if (!confirm("Delete this link?")) return;
    try {
      await fetch(`/api/shorten/${keyword}`, { method: "DELETE" });
      toast(t("common.success"), "success");
      router.refresh();
    } catch {
      toast(t("common.error"), "error");
    }
  };

  if (urls.length === 0) {
    return (
      <div
        className="p-16 text-center animate-fade-in border"
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
        <p className="font-serif text-[22px]" style={{ color: "var(--text-primary)" }}>
          No links yet
        </p>
        <p className="text-[14px] mt-2" style={{ color: "var(--text-muted)" }}>
          Shorten your first URL to get started.
        </p>
      </div>
    );
  }

  const cellPad = "px-5 py-4";
  const headPad = "px-5 py-3";

  return (
    <>
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
                <th className={`${headPad} text-left w-10`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="cursor-pointer"
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                </th>
                <th
                  className={`${headPad} text-left text-[11px] font-medium uppercase tracking-[0.1em]`}
                  style={{ color: "var(--text-muted)" }}
                >
                  Short link
                </th>
                <th
                  className={`${headPad} text-left text-[11px] font-medium uppercase tracking-[0.1em] hidden md:table-cell`}
                  style={{ color: "var(--text-muted)" }}
                >
                  Destination
                </th>
                <th
                  className={`${headPad} text-right text-[11px] font-medium uppercase tracking-[0.1em]`}
                  style={{ color: "var(--text-muted)" }}
                >
                  Clicks
                </th>
                <th
                  className={`${headPad} text-left text-[11px] font-medium uppercase tracking-[0.1em] hidden lg:table-cell`}
                  style={{ color: "var(--text-muted)" }}
                >
                  Status
                </th>
                <th
                  className={`${headPad} text-right text-[11px] font-medium uppercase tracking-[0.1em]`}
                  style={{ color: "var(--text-muted)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {urls.map((item) => (
                <tr
                  key={item.keyword}
                  className="group transition-colors"
                  style={{ borderBottom: "1px solid var(--border-soft)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-elevated)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td className={cellPad}>
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(item.keyword)}
                      onChange={() => onToggleSelect(item.keyword)}
                      className="cursor-pointer"
                      style={{ accentColor: "var(--color-primary)" }}
                    />
                  </td>
                  <td className={cellPad}>
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
                          <a
                            href={`/${item.keyword}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[13px] inline-flex items-center gap-1 hover:underline"
                            style={{ color: "var(--color-primary)" }}
                          >
                            /{item.keyword}
                            <ExternalLink size={11} strokeWidth={1.75} />
                          </a>
                          {item.hasPassword && (
                            <Lock
                              size={11}
                              strokeWidth={1.75}
                              style={{ color: "var(--text-muted)" }}
                              aria-label="Password protected"
                            />
                          )}
                        </span>
                        <p
                          className="text-[13px] truncate mt-0.5"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.title || (
                            <span style={{ color: "var(--text-muted)" }}>
                              Untitled
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={`${cellPad} hidden md:table-cell`}>
                    <p
                      className="text-[13px] truncate max-w-[320px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.url}
                    </p>
                  </td>
                  <td className={`${cellPad} text-right`}>
                    <Link
                      href={`/admin/stats/${item.keyword}`}
                      className="inline-flex items-center gap-1.5 font-mono text-[13px] tabular-nums cursor-pointer hover:underline"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.clicks.toLocaleString()}
                      <BarChart3
                        size={12}
                        strokeWidth={1.75}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </Link>
                  </td>
                  <td className={`${cellPad} hidden lg:table-cell`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: item.isHealthy
                              ? "var(--color-success)"
                              : "var(--color-danger)",
                          }}
                        />
                        <span
                          style={{
                            color: item.isHealthy
                              ? "var(--color-success)"
                              : "var(--color-danger)",
                          }}
                        >
                          {item.isHealthy ? "Healthy" : "Down"}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 text-[11px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Clock size={10} strokeWidth={1.75} />
                        {timeAgo(item.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className={cellPad}>
                    <div className="flex items-center justify-end gap-0.5">
                      {[
                        { fn: () => handleCopy(item.keyword), icon: Copy, label: "Copy" },
                        { fn: () => setShowQR(item.keyword), icon: QrCode, label: "QR" },
                        { fn: () => setEditingItem(item), icon: Edit2, label: "Edit" },
                        { fn: () => handleDelete(item.keyword), icon: Trash2, label: "Delete" },
                      ].map((a, idx) => {
                        const isDanger = a.label === "Delete";
                        return (
                          <button
                            key={idx}
                            onClick={a.fn}
                            title={a.label}
                            className="p-1.5 cursor-pointer rounded transition-colors opacity-100"
                            style={{ color: "var(--text-secondary)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = isDanger
                                ? "var(--color-danger)"
                                : "var(--text-primary)";
                              e.currentTarget.style.background = "var(--bg-hover)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-secondary)";
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <a.icon size={14} strokeWidth={1.75} />
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditLinkModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            router.refresh();
          }}
        />
      )}

      {/* QR Modal */}
      {showQR && <QrModal keyword={showQR} onClose={() => setShowQR(null)} />}
    </>
  );
}
