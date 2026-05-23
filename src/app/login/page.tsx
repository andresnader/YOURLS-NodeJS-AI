"use client";

import { useState } from "react";
import { Lock, User, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const url = new URL(window.location.href);
        const next = url.searchParams.get("next") || "/admin";
        window.location.href = next;
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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Masthead */}
        <header className="text-center mb-10 space-y-2">
          <p className="text-eyebrow">YOURLS Node</p>
          <h1 className="text-h2" style={{ color: "var(--text-primary)" }}>
            Sign in
          </h1>
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Welcome back. Enter your credentials to continue.
          </p>
        </header>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-5 p-8 border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-[12px] font-medium block"
              style={{ color: "var(--text-muted)" }}
            >
              Username
            </label>
            <div className="relative">
              <User
                size={15}
                strokeWidth={1.75}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Username"
                className="input-glass pl-10"
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-[12px] font-medium block"
              style={{ color: "var(--text-muted)" }}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                size={15}
                strokeWidth={1.75}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-glass pl-10"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="px-3 py-2 text-[13px]"
              style={{
                background: "rgba(185, 28, 28, 0.06)",
                border: "1px solid rgba(185, 28, 28, 0.18)",
                color: "var(--color-danger)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-[14px]"
          >
            {loading ? (
              <>
                <Loader2 size={15} strokeWidth={1.75} className="animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={15} strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        <p
          className="text-center text-[12px] mt-8"
          style={{ color: "var(--text-muted)" }}
        >
          YOURLS Node — self-hosted link management
        </p>
      </div>
    </main>
  );
}
