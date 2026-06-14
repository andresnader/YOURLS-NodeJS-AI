"use client";

import { useState, use } from "react";
import { Lock, ArrowRight, Loader2 } from "lucide-react";

export default function ProtectedLinkPage({
  params,
}: {
  params: Promise<{ keyword: string }>;
}) {
  const { keyword } = use(params);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/protected/${keyword}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Incorrect password");
        setLoading(false);
      }
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">
        <header className="text-center mb-10 space-y-2">
          <p className="text-eyebrow">YOURLS Node</p>
          <h1 className="text-h2" style={{ color: "var(--text-primary)" }}>
            Protected link
          </h1>
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            This short link is password protected. Enter the password to continue.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-8 border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
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
                autoFocus
                autoComplete="off"
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
                Verifying…
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={15} strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
