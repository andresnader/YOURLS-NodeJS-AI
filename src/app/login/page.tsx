"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center p-3 mb-4 shadow-[0_0_40px_-10px_rgba(0,240,255,0.4)]">
                <Sparkles className="text-[var(--color-primary)] w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-widest text-center dark:text-white text-gray-900">REFRACT<span className="text-[var(--color-primary)]">_O</span></h1>
            <p className="text-gray-500 mt-2 text-center">Secure Administration Access</p>
        </div>

        <form onSubmit={handleLogin} className="glass-panel p-8 rounded-3xl backdrop-blur-3xl shadow-2xl">
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock size={20} />
                </div>
                <input 
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter Admin Password"
                    className="w-full pl-12 pr-4 py-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl outline-none text-gray-900 dark:text-white focus:border-[var(--color-primary)] transition-colors focus:shadow-[0_0_20px_-5px_rgba(0,240,255,0.2)]"
                />
            </div>
            
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[#05070c] py-4 rounded-xl font-bold transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(0,240,255,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Authenticating..." : "Unlock Dashboard"}
                {!loading && <ArrowRight size={20} />}
            </button>
        </form>
      </div>
    </main>
  );
}
