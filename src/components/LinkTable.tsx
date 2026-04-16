"use client";

import { useState } from "react";
import {
  ExternalLink, BarChart3, Copy, Edit2, Trash2,
  QrCode, X, Check, Clock, Globe
} from "lucide-react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import Link from "next/link";

interface UrlItem {
  keyword: string;
  url: string;
  title: string | null;
  clicks: number;
  createdAt: string;
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
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [showQR, setShowQR] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleCopy = async (keyword: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${keyword}`);
      toast("Short URL copied to clipboard!", "success");
    } catch {
      toast("Failed to copy", "error");
    }
  };

  const handleDelete = async (keyword: string) => {
    if (!confirm("Delete this link permanently?")) return;
    try {
      await fetch(`/api/shorten/${keyword}`, { method: "DELETE" });
      toast("Link deleted", "success");
      router.refresh();
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const startEdit = (item: UrlItem) => {
    setEditingKey(item.keyword);
    setEditUrl(item.url);
    setEditTitle(item.title || "");
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditUrl("");
    setEditTitle("");
  };

  const saveEdit = async (keyword: string) => {
    try {
      const res = await fetch(`/api/shorten/${keyword}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: editUrl, title: editTitle || null }),
      });
      if (res.ok) {
        toast("Link updated successfully", "success");
        cancelEdit();
        router.refresh();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to update", "error");
      }
    } catch {
      toast("Network error", "error");
    }
  };

  if (urls.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center animate-fade-in">
        <Globe size={40} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
        <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
          No transmissions yet
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Shorten your first URL above to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="glass rounded-2xl overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid var(--border-glass)" }}>
                <th className="text-left px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="rounded cursor-pointer"
                    style={{ accentColor: "#00F0FF" }}
                  />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  Short URL
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.12em] hidden md:table-cell" style={{ color: "var(--text-muted)" }}>
                  Destination
                </th>
                <th className="text-center px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  Clicks
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.12em] hidden lg:table-cell" style={{ color: "var(--text-muted)" }}>
                  Created
                </th>
                <th className="text-right px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {urls.map((item) => (
                <tr
                  key={item.keyword}
                  className="group transition-colors"
                  style={{ borderBottom: "1px solid var(--border-glass)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(item.keyword)}
                      onChange={() => onToggleSelect(item.keyword)}
                      className="rounded cursor-pointer"
                      style={{ accentColor: "#00F0FF" }}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    {editingKey === item.keyword ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title"
                          className="input-glass text-xs py-1.5"
                        />
                        <input
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="input-glass text-xs py-1.5"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/${item.keyword}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-sm hover:underline"
                            style={{ color: "#00F0FF" }}
                          >
                            /{item.keyword}
                          </a>
                          <ExternalLink size={12} style={{ color: "var(--text-muted)" }} />
                        </div>
                        {item.title && (
                          <p className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>
                            {item.title}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <p className="text-xs truncate max-w-[300px]" style={{ color: "var(--text-secondary)" }}>
                      {item.url}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Link
                      href={`/admin/stats/${item.keyword}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{ color: "#00F0FF" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0, 240, 255, 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <BarChart3 size={13} />
                      {item.clicks.toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Clock size={12} />
                      {timeAgo(item.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {editingKey === item.keyword ? (
                        <>
                          <button
                            onClick={() => saveEdit(item.keyword)}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: "var(--color-success)" }}
                            title="Save"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: "var(--color-danger)" }}
                            title="Cancel"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleCopy(item.keyword)}
                            className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"
                            style={{ color: "var(--text-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#00F0FF"; e.currentTarget.style.background = "rgba(0, 240, 255, 0.08)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                            title="Copy short URL"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => setShowQR(item.keyword)}
                            className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"
                            style={{ color: "var(--text-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#A855F7"; e.currentTarget.style.background = "rgba(168, 85, 247, 0.08)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                            title="QR code"
                          >
                            <QrCode size={14} />
                          </button>
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"
                            style={{ color: "var(--text-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#FBBF24"; e.currentTarget.style.background = "rgba(251, 191, 36, 0.08)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.keyword)}
                            className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"
                            style={{ color: "var(--text-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-danger)"; e.currentTarget.style.background = "rgba(248, 113, 113, 0.08)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(4, 6, 9, 0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowQR(null)}
        >
          <div
            className="glass p-8 rounded-2xl flex flex-col items-center gap-5 relative animate-slide-up max-w-sm w-full mx-4"
            style={{ boxShadow: "var(--shadow-deep), 0 0 60px -15px rgba(0, 240, 255, 0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mt-2" style={{ color: "var(--text-primary)" }}>
              QR Code
            </h3>
            <p
              className="text-xs font-semibold font-mono px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(0, 240, 255, 0.08)",
                color: "#00F0FF",
                border: "1px solid rgba(0, 240, 255, 0.15)",
              }}
            >
              /{showQR}
            </p>
            <div className="p-5 bg-white rounded-xl">
              <QRCode value={`${window.location.origin}/${showQR}`} size={200} />
            </div>
            <button
              onClick={() => handleCopy(showQR)}
              className="btn-cyber w-full rounded-xl py-2.5 text-sm"
            >
              <Copy size={14} />
              Copy Short URL
            </button>
          </div>
        </div>
      )}
    </>
  );
}
