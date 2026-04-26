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
        window.location.href = "/admin";
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
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient flares */}
      <div
        className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, transparent 70%)",
          animation: "floatOrb 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[15%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 70%)",
          animation: "floatOrb 25s ease-in-out infinite reverse",
        }}
      />

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 animate-glow-pulse"
            style={{
              background: "linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(168, 85, 247, 0.1))",
              border: "1px solid rgba(0, 240, 255, 0.2)",
              boxShadow: "0 0 40px -10px rgba(0, 240, 255, 0.3)",
            }}
          >
            <Sparkles style={{ color: "#00F0FF" }} size={28} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-widest" style={{ color: "var(--text-primary)" }}>
            YOURLS<span style={{ color: "#00F0FF" }}>Node</span>
          </h1>
          <p className="text-sm mt-2 tracking-wide" style={{ color: "var(--text-muted)" }}>
            Refractive Link Management
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="glass rounded-2xl p-8"
        >
          <div className="mb-6">
            <label
              className="block text-[11px] font-semibold uppercase tracking-[0.15em] mb-2.5"
              style={{ color: "var(--text-muted)" }}
            >
              Access Key
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter admin password"
                className="input-glass pl-10"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div
              className="mb-5 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "rgba(248, 113, 113, 0.08)",
                color: "var(--color-danger)",
                border: "1px solid rgba(248, 113, 113, 0.15)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-cyber w-full py-3 rounded-xl text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5 0 0 5 0 12h4zm2 5.3a8 8 0 01-1.9-2.6H0c.5 1.5 1.3 2.8 2.3 3.9l3.7-1.3z" />
                </svg>
                Authenticating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Unlock Dashboard
                <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] mt-8 tracking-wider" style={{ color: "var(--text-muted)" }}>
          Powered by <span style={{ color: "#00F0FF" }}>YOURLS Node</span> · Refractive Engine
        </p>
      </div>
    </main>
  );
}
