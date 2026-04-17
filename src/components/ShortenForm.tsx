"use client";

import { Link2, Zap, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import { useTranslation } from "@/lib/LanguageContext";

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
        {/* Main input — glass pill */}
        <div
          className="flex items-center gap-2 p-2 rounded-2xl md:rounded-full transition-all glass shadow-glow-sm"
        >
          <div className="pl-4 text-muted">
            <Link2 size={20} />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder={t("admin.paste_url")}
            className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-sm text-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-cyber rounded-2xl md:rounded-full px-7 py-3 text-sm whitespace-nowrap min-w-[140px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" />
                {t("admin.shortening")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Zap size={15} />
                {t("admin.shorten_now")}
              </span>
            )}
          </button>
        </div>

        {/* Advanced toggle */}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] font-bold uppercase tracking-widest px-6 py-2 rounded-full transition-all text-muted hover:text-primary hover:bg-white/5"
          >
            <span className="flex items-center gap-2">
               {showAdvanced ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
               {showAdvanced ? t("admin.hide_options") : t("admin.advanced_options")}
            </span>
          </button>
        </div>

        {/* Advanced options */}
        {showAdvanced && (
          <div
            className="mt-4 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up glass-subtle transition-colors duration-300"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted pl-1">
                {t("admin.custom_slug")}
              </label>
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="my-link-2024"
                className="input-glass text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted pl-1">
                {t("admin.custom_title")}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("admin.auto_metadata")}
                className="input-glass text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted pl-1">
                Redirect Protocol
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRedirectType(301)}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-bold tracking-widest transition-all border ${redirectType === 301 ? 'bg-primary/20 border-primary shadow-glow-sm text-primary' : 'bg-white/5 border-white/10 text-muted'}`}
                >
                  301 PERMANENT
                </button>
                <button
                  type="button"
                  onClick={() => setRedirectType(302)}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-bold tracking-widest transition-all border ${redirectType === 302 ? 'bg-primary/20 border-primary shadow-glow-sm text-primary' : 'bg-white/5 border-white/10 text-muted'}`}
                >
                  302 TEMPORARY
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted pl-1">
                Password Lock
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-glass text-sm"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

