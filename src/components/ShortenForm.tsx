"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ShortenForm() {
  const [url, setUrl] = useState("");
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
        body: JSON.stringify({ url })
      });
      
      if (res.ok) {
        setUrl("");
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
    <form onSubmit={handleSubmit} className="w-full relative z-10 glass-panel p-2 rounded-full flex items-center gap-2 transition-all hover:border-[var(--color-primary)]/30 hover:shadow-[0_0_30px_-5px_rgba(0,240,255,0.2)]">
      <div className="pl-4 text-gray-400">
        <Link2 size={24} />
      </div>
      <input 
        type="url" 
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        placeholder="Paste your long URL here..." 
        className="flex-1 bg-transparent border-none outline-none text-white px-2 py-3 placeholder:text-gray-600 focus:ring-0"
      />
      <button 
        type="submit"
        disabled={loading}
        className="bg-[var(--color-primary)] text-[#05070c] px-8 py-3 rounded-full font-bold transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-3px_rgba(0,240,255,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Shortening..." : "Shorten"}
      </button>
    </form>
  );
}
