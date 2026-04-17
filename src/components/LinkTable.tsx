"use client";

import { useState } from "react";
import {
  ExternalLink, BarChart3, Copy, Edit2, Trash2,
  QrCode, X, Check, Clock, Globe, ShieldCheck, ShieldAlert
} from "lucide-react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import Link from "next/link";
import { useTranslation } from "@/lib/LanguageContext";

interface UrlItem {
  keyword: string;
  url: string;
  title: string | null;
  favicon: string | null;
  isHealthy: boolean;
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
        toast(t("common.success"), "success");
        cancelEdit();
        router.refresh();
      } else {
        const data = await res.json();
        toast(data.error || t("common.error"), "error");
      }
    } catch {
      toast(t("common.error"), "error");
    }
  };

  if (urls.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center animate-fade-in relative transition-colors duration-300">
        <Globe size={40} className="mx-auto mb-4 text-muted" />
        <p className="text-lg font-medium text-secondary">
          {t("admin.all_links")}
        </p>
        <p className="text-sm mt-1 text-muted">
          Shorten your first URL to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="glass rounded-2xl overflow-hidden animate-slide-up transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02] border-b border-glass transition-colors">
                <th className="text-left px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="rounded cursor-pointer"
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.12em] text-muted">
                  Short URL
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.12em] text-muted hidden md:table-cell">
                  Destination
                </th>
                <th className="text-center px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.12em] text-muted">
                  Clicks
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.12em] text-muted hidden lg:table-cell">
                  Status
                </th>
                <th className="text-right px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.12em] text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {urls.map((item) => (
                <tr
                  key={item.keyword}
                  className="group transition-colors border-b border-glass hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(item.keyword)}
                      onChange={() => onToggleSelect(item.keyword)}
                      className="rounded cursor-pointer"
                      style={{ accentColor: "var(--color-primary)" }}
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
                      <div className="flex items-start gap-3">
                        {item.favicon ? (
                          <img src={item.favicon} alt="" className="w-5 h-5 rounded mt-1 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center mt-1 shrink-0">
                             <Globe size={10} className="text-muted" />
                          </div>
                        )}
                        <div className="overflow-hidden min-w-0">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`/${item.keyword}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-sm hover:underline text-primary truncate"
                            >
                              /{item.keyword}
                            </a>
                            <ExternalLink size={12} className="text-muted shrink-0" />
                          </div>
                          <p className="text-[10px] opacity-40 uppercase tracking-widest truncate">
                             {item.title || "No Title"}
                          </p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <p className="text-xs truncate max-w-[300px] text-secondary">
                      {item.url}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Link
                      href={`/admin/stats/${item.keyword}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all text-primary hover:bg-primary/10"
                    >
                      <BarChart3 size={13} />
                      {item.clicks.toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center gap-1 text-[10px] font-bold ${item.isHealthy ? "text-success" : "text-danger"}`}>
                        {item.isHealthy ? <ShieldCheck size={10}/> : <ShieldAlert size={10}/>}
                        {item.isHealthy ? "HEALTHY" : "DOWN"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <Clock size={10} />
                        {timeAgo(item.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {editingKey === item.keyword ? (
                        <>
                          <button
                            onClick={() => saveEdit(item.keyword)}
                            className="p-1.5 rounded-md transition-colors text-success"
                            title="Save"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded-md transition-colors text-danger"
                            title="Cancel"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleCopy(item.keyword)}
                            className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 text-muted hover:text-primary hover:bg-primary/10"
                            title="Copy short URL"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => setShowQR(item.keyword)}
                            className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 text-muted hover:text-accent hover:bg-accent/10"
                            title="QR code"
                          >
                            <QrCode size={14} />
                          </button>
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 text-muted hover:text-amber-400 hover:bg-amber-400/10"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.keyword)}
                            className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 text-muted hover:text-danger hover:bg-danger/10"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowQR(null)}
        >
          <div
            className="glass p-8 rounded-2xl flex flex-col items-center gap-5 relative animate-zoom-in max-w-sm w-full shadow-glow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-primary transition-colors"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-primary">
              QR Code
            </h3>
            <p
              className="text-xs font-semibold font-mono px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              /{showQR}
            </p>
            <div className="p-5 bg-white rounded-2xl">
              <QRCode value={`${window.location.origin}/${showQR}`} size={200} />
            </div>
            <button
              onClick={() => handleCopy(showQR)}
              className="btn-cyber w-full rounded-2xl py-3 text-sm"
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

