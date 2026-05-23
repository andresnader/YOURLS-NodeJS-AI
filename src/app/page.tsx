import Link from "next/link";
import PublicShortenForm from "@/components/PublicShortenForm";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const totalLinks = await prisma.url.count();
  const totalClicksResult = await prisma.url.aggregate({
    _sum: { clicks: true },
  });
  const totalClicks = totalClicksResult._sum.clicks || 0;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top bar */}
      <nav
        className="px-6 md:px-12 py-6 flex items-center justify-between border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <Link href="/" className="font-serif text-[20px] leading-none">
          <span style={{ color: "var(--text-primary)" }}>YOURLS</span>
          <span className="italic" style={{ color: "var(--color-primary)" }}>
            {" "}
            Node
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="btn-ghost text-[13px]">
            Dashboard
          </Link>
          <Link href="/login" className="btn-primary text-[13px] px-4 py-2">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 max-w-3xl mx-auto w-full">
        <p className="text-eyebrow mb-6">URL shortener</p>
        <h1
          className="text-display text-center mb-6"
          style={{ color: "var(--text-primary)" }}
        >
          Long links, made{" "}
          <em
            className="italic"
            style={{ color: "var(--color-primary)", fontStyle: "italic" }}
          >
            short
          </em>
          .
        </h1>
        <p
          className="text-center text-[17px] leading-relaxed max-w-prose mb-12"
          style={{ color: "var(--text-secondary)" }}
        >
          A self-hosted URL shortener built for teams who care about ownership
          and analytics. Paste a link, share what you create.
        </p>

        <PublicShortenForm />
      </section>

      {/* Stats strip */}
      <section
        className="border-t border-b px-6 md:px-12 py-10"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-deep)",
        }}
      >
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8">
          {[
            { value: totalLinks, label: "Links created" },
            { value: totalClicks, label: "Redirects served" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="font-serif text-[32px] md:text-[40px] leading-none mb-2 tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
              </p>
              <p className="text-eyebrow">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-3"
        style={{ color: "var(--text-muted)" }}
      >
        <p className="text-[13px]">
          Self-hosted on YOURLS Node — open source.
        </p>
        <p className="text-eyebrow">v1.0</p>
      </footer>
    </main>
  );
}
