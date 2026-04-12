"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ShortenForm() {
  const [url, setUrl] = useState("");
  const [customKeyword, setCustomKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, customKeyword })
      });
      
      if (res.ok) {
        setUrl("");
        setCustomKeyword("");
        // Refrescar el server component padre para que muestre el nuevo link
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to shorten URL");
      }
    } catch (error) {
      console.error(error);
      alert("Error occurred while shortening");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative z-10 glass-panel p-2 rounded-full flex items-center gap-2 transition-all hover:border-[var(--color-primary)]/30 hover:shadow-[0_0_30px_-5px_rgba(0,240,255,0.2)] dark:bg-black/20">
      <form onSubmit={handleSubmit} className="flex-1 flex items-center h-full">
        <div className="pl-4 text-gray-400 dark:text-gray-500">
            <Link2 size={24} />
        </div>
        <input 
            type="url" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="Paste your long URL here..." 
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white px-2 py-3 placeholder:text-gray-500 dark:placeholder:text-gray-600 focus:ring-0"
        />
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-700/50 mx-2"></div>
        <input 
            type="text" 
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            placeholder="Custom slug (optional)" 
            className="max-w-[180px] bg-transparent border-none outline-none text-gray-900 dark:text-white px-2 py-3 placeholder:text-gray-500 dark:placeholder:text-gray-600 focus:ring-0 hidden sm:block"
            pattern="[a-zA-Z0-9_-]+"
            title="Alphanumeric characters, dashes and underscores only"
        />
        <button 
            type="submit"
            disabled={loading}
            className="bg-[var(--color-primary)] text-[#05070c] px-8 py-3 rounded-full font-bold transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-3px_rgba(0,240,255,0.6)] disabled:opacity-50 disabled:cursor-not-allowed ml-2"
        >
            {loading ? "..." : "Shorten"}
        </button>
      </form>
    </div>
  );
}
