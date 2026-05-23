"use client";

import { Link2, Settings2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";

export default function PublicShortenForm() {
  const [url, setUrl] = useState("");
  const [customKeyword, setCustomKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastShortUrl, setLastShortUrl] = useState("");
  const [copied, setCopied] = useState(false);

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
          redirectType: 302,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const shortUrl = `${window.location.origin}/${data.data.keyword}`;
        setLastShortUrl(shortUrl);
        toast("Success! Your link is ready.", "success");

        try {
          await navigator.clipboard.writeText(shortUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch {}

        setUrl("");
        setCustomKeyword("");
        setShowAdvanced(false);
        router.refresh();
      } else {
        const errorData = await res.json();
        toast(errorData.error || "Failed to shorten URL", "error");
      }
    } catch {
      toast("Connection error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!lastShortUrl) return;
    try {
      await navigator.clipboard.writeText(lastShortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast("Copied to clipboard", "success");
    } catch {}
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3"
      >
        <div
          className="flex items-center gap-3 px-4"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--input-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Link2
            size={18}
            strokeWidth={1.75}
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="Paste your long link"
            className="flex-1 bg-transparent border-none outline-none py-3 text-[15px]"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-ghost px-4"
          aria-label="Advanced options"
          title="Advanced options"
        >
          <Settings2 size={16} strokeWidth={1.75} />
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-6 whitespace-nowrap min-w-[140px]"
        >
          {loading ? "Shortening…" : "Shorten"}
        </button>
      </form>

      {showAdvanced && (
        <div
          className="p-5 border animate-slide-down"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-soft)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <label
            className="text-[12px] font-medium block mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Custom slug (optional)
          </label>
          <input
            type="text"
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            placeholder="my-link"
            className="input-glass font-mono text-[13px]"
          />
        </div>
      )}

      {lastShortUrl && (
        <div
          className="px-5 py-4 flex flex-wrap items-center gap-3 animate-fade-in border"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-glow)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <span
            className="text-eyebrow shrink-0"
            style={{ color: "var(--text-muted)" }}
          >
            Created
          </span>
          <code
            className="font-mono text-[14px] flex-1 min-w-0 truncate select-all"
            style={{ color: "var(--color-primary)" }}
          >
            {lastShortUrl.replace(/^https?:\/\//, "")}
          </code>
          <button
            onClick={handleCopy}
            className="btn-ghost px-3 py-2"
            aria-label="Copy"
          >
            {copied ? (
              <>
                <Check size={14} strokeWidth={1.75} />
                Copied
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={1.75} />
                Copy
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
