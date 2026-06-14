import Link from "next/link";
import PublicShortenForm from "@/components/PublicShortenForm";

export default function LandingPage() {
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

      {/* Footer */}
      <footer
        className="px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-3 border-t"
        style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
      >
        <p className="text-[13px]">
          Self-hosted on YOURLS Node — open source.
        </p>
        <p className="text-eyebrow">v1.0</p>
      </footer>
    </main>
  );
}
