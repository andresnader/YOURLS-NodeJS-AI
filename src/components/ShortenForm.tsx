"use client";

import { Link2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import { useTranslation } from "@/lib/LanguageContext";
import RedirectTypeHelp from "./RedirectTypeHelp";

export default function ShortenForm() {
  const [url, setUrl] = useState("");
  const [customKeyword, setCustomKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [redirectType, setRedirectType] = useState<301 | 302>(301);
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          customKeyword: customKeyword || undefined,
          title: title || undefined,
          redirectType,
          password: password || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const shortUrl = `${window.location.origin}/${data.data.keyword}`;

        try {
          await navigator.clipboard.writeText(shortUrl);
          toast(t("common.success"), "success");
        } catch {
          toast(t("common.success"), "success");
        }

        setUrl("");
        setCustomKeyword("");
        setTitle("");
        setPassword("");
        setRedirectType(301);
        setShowAdvanced(false);
        
        // Dispatch instant update event
        window.dispatchEvent(new CustomEvent('link-created', { 
          detail: data.data 
        }));

        router.refresh();
      } else {
        const errorData = await res.json();
        toast(errorData.error || t("common.error"), "error");
      }
    } catch {
      toast(t("common.error"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <form onSubmit={handleSubmit} className="w-full">
        {/* Main input row — editorial */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <div
            className="flex items-center gap-3 px-4 rounded-md border transition-colors"
            style={{
              background: "var(--input-bg)",
              borderColor: "var(--input-border)",
            }}
          >
            <Link2 size={18} style={{ color: "var(--text-muted)" }} />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder={t("admin.paste_url")}
              className="flex-1 bg-transparent border-none outline-none py-3 text-[15px]"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-3 text-[14px] whitespace-nowrap min-w-[160px]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                <span>{t("admin.shortening")}</span>
              </>
            ) : (
              <span>{t("admin.shorten_now")}</span>
            )}
          </button>
        </div>

        {/* Advanced toggle */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAdvanced ? t("admin.hide_options") : t("admin.advanced_options")}
          </button>
        </div>

        {/* Advanced options */}
        {showAdvanced && (
          <div
            className="mt-5 p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-5 animate-slide-up border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-soft)",
            }}
          >
            <div className="space-y-2">
              <label
                className="text-[11px] font-medium block"
                style={{ color: "var(--text-muted)" }}
              >
                {t("admin.custom_slug")}
              </label>
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="my-link-2024"
                className="input-glass font-mono text-[13px]"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-[11px] font-medium block"
                style={{ color: "var(--text-muted)" }}
              >
                {t("admin.custom_title")}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("admin.auto_metadata")}
                className="input-glass text-[14px]"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-[11px] font-medium block"
                style={{ color: "var(--text-muted)" }}
              >
                {t("admin.redirect_protocol")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 301 as const, label: t("admin.redirect_permanent") },
                  { value: 302 as const, label: t("admin.redirect_temporary") },
                ].map((opt) => {
                  const selected = redirectType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRedirectType(opt.value)}
                      className="py-2.5 rounded-md text-[12px] font-medium border cursor-pointer transition-colors"
                      style={{
                        background: selected
                          ? "var(--color-primary)"
                          : "var(--bg-surface)",
                        borderColor: selected
                          ? "var(--color-primary)"
                          : "var(--input-border)",
                        color: selected ? "#FFFFFF" : "var(--text-secondary)",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <RedirectTypeHelp />
            </div>
            <div className="space-y-2">
              <label
                className="text-[11px] font-medium block"
                style={{ color: "var(--text-muted)" }}
              >
                {t("admin.password_lock")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-glass text-[14px]"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

