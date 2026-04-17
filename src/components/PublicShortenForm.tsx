"use client";

import { Link2, Zap, Settings2, Copy, Check } from "lucide-react";
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const shortUrl = `${window.location.origin}/${data.data.keyword}`;
        setLastShortUrl(shortUrl);
        
        toast("Success! Your link is ready.", "success");
        
        // Auto copy
        try {
          await navigator.clipboard.writeText(shortUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch (err) {}

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
    } catch (err) {}
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div 
        className="glass p-1.5 rounded-[32px] overflow-hidden"
        style={{
          boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.5), 0 0 20px -5px rgba(0, 240, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center gap-2">
          <div className="flex-1 flex items-center gap-3 px-6 w-full py-2">
            <Link2 className="text-[#00F0FF] opacity-60" size={22} />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="Paste your long link here..."
              className="w-full bg-transparent border-none outline-none py-3 text-lg font-medium placeholder:text-white/20"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          
          <div className="flex items-center gap-2 p-1.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-3 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-[#00F0FF]"
              title="Advanced Options"
            >
              <Settings2 size={20} />
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-cyber !py-4 !px-10 !text-base w-full md:w-auto shadow-[0_0_30px_-5px_rgba(0,240,255,0.4)]"
            >
              {loading ? "Procuring..." : "Shorten"}
            </button>
          </div>
        </form>
      </div>

      {/* Advanced Options - Slide Down */}
      {showAdvanced && (
        <div className="glass-subtle rounded-2xl p-6 animate-slide-down max-w-xl mx-auto border-dashed border-white/10">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F0FF] mb-3 opacity-80">
            Custom Slug (Optional)
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00F0FF] transition-colors">
              <Zap size={16} />
            </div>
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="my-secret-link"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#00F0FF]/40 focus:bg-white/10 transition-all font-mono text-sm"
            />
          </div>
        </div>
      )}

      {/* Result Card */}
      {lastShortUrl && (
        <div className="animate-fade-in flex flex-col items-center">
          <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded-2xl px-8 py-4 flex items-center gap-4 backdrop-blur-md">
            <span className="text-white/60 text-sm font-medium">Link created:</span>
            <code className="text-[#00F0FF] font-bold text-lg select-all">
              {lastShortUrl.replace(/^https?:\/\//, "")}
            </code>
            <button 
              onClick={handleCopy}
              className="p-2.5 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/30 transition-all active:scale-95"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
