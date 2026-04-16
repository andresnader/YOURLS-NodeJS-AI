"use client";

import { Link2, Zap } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";

export default function ShortenForm() {
  const [url, setUrl] = useState("");
  const [customKeyword, setCustomKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const shortUrl = `${window.location.origin}/${data.data.keyword}`;

        try {
          await navigator.clipboard.writeText(shortUrl);
          toast(`Transmission created & copied: ${shortUrl}`, "success");
        } catch {
          toast(`Transmission created: ${shortUrl}`, "success");
        }

        setUrl("");
        setCustomKeyword("");
        setTitle("");
        setShowAdvanced(false);
        router.refresh();
      } else {
        const errorData = await res.json();
        toast(errorData.error || "Failed to shorten URL", "error");
      }
    } catch {
      toast("Network error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <form onSubmit={handleSubmit} className="w-full">
        {/* Main input — glass pill */}
        <div
          className="flex items-center gap-2 p-2 rounded-full transition-all glass"
          style={{
            boxShadow: "var(--shadow-card)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.2)";
            e.currentTarget.style.boxShadow = "0 0 40px -10px rgba(0, 240, 255, 0.15), var(--shadow-card)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-glass)";
            e.currentTarget.style.boxShadow = "var(--shadow-card)";
          }}
        >
          <div className="pl-4" style={{ color: "var(--text-muted)" }}>
            <Link2 size={20} />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="Paste your long URL here…"
            className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-cyber rounded-full px-7 py-3 text-sm whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5 0 0 5 0 12h4zm2 5.3a8 8 0 01-1.9-2.6H0c.5 1.5 1.3 2.8 2.3 3.9l3.7-1.3z" />
                </svg>
                Transmitting…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Zap size={15} />
                Shorten
              </span>
            )}
          </button>
        </div>

        {/* Advanced toggle */}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] font-medium px-4 py-1.5 rounded-full transition-all"
            style={{
              color: "var(--text-muted)",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#00F0FF";
              e.currentTarget.style.borderColor = "var(--border-glass)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            {showAdvanced ? "▲ Hide options" : "▼ Advanced options"}
          </button>
        </div>

        {/* Advanced options */}
        {showAdvanced && (
          <div
            className="mt-2 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-down glass-subtle"
          >
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--text-muted)" }}>
                Custom slug
              </label>
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="my-custom-slug"
                pattern="[a-zA-Z0-9_-]+"
                title="Letters, numbers, dashes and underscores only"
                className="input-glass text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--text-muted)" }}>
                Title (auto-fetched)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My awesome page"
                className="input-glass text-sm"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
