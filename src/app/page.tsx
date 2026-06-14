import Link from "next/link";
import { Globe, BarChart3, QrCode, ShieldCheck } from "lucide-react";
import PublicShortenForm from "@/components/PublicShortenForm";

const features = [
  {
    icon: Globe,
    title: "Tu dominio, tu marca",
    body: "Cada enlace vive en ameiz.in. Profesional, reconocible y 100% tuyo — desde el primer clic.",
  },
  {
    icon: BarChart3,
    title: "Analíticas en tiempo real",
    body: "Clics, ubicación, dispositivo y navegador. Descubre qué funciona en el instante exacto en que sucede.",
  },
  {
    icon: QrCode,
    title: "Códigos QR a tu medida",
    body: "Un QR por enlace, con tu color y tu logo al centro. Descárgalo en PNG o SVG, listo para imprimir.",
  },
  {
    icon: ShieldCheck,
    title: "Privado por diseño",
    body: "Self-hosted, sin intermediarios. Protege enlaces con contraseña y conserva el control absoluto de tus datos.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Top bar */}
      <nav
        className="px-6 md:px-12 py-6 flex items-center justify-between border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <Link href="/" className="font-serif text-[20px] leading-none">
          <span style={{ color: "var(--text-primary)" }}>ameiz</span>
          <span className="italic" style={{ color: "var(--color-primary)" }}>
            .in
          </span>
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 max-w-3xl mx-auto w-full">
        <p className="text-eyebrow mb-6">Acortador de enlaces · por Ameizin</p>
        <h1
          className="text-display text-center mb-6"
          style={{ color: "var(--text-primary)" }}
        >
          Enlaces cortos.{" "}
          <em
            className="italic"
            style={{ color: "var(--color-primary)", fontStyle: "italic" }}
          >
            Marca grande
          </em>
          .
        </h1>
        <p
          className="text-center text-[17px] leading-relaxed max-w-prose mb-12"
          style={{ color: "var(--text-secondary)" }}
        >
          Convierte cualquier URL en un enlace de ameiz.in y hazlo parte de tu
          marca. Analíticas en vivo, códigos QR con tu logo y privacidad total.
          Tus datos, siempre tuyos.
        </p>

        <PublicShortenForm />
      </section>

      {/* Features */}
      <section
        className="border-t px-6 md:px-12 py-20 md:py-28"
        style={{ borderColor: "var(--border)", background: "var(--bg-deep)" }}
      >
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-16 space-y-3">
            <p className="text-eyebrow">Características</p>
            <h2
              className="font-serif text-[30px] md:text-[40px] leading-tight tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Pensado hasta el último clic.
            </h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-start">
                <div
                  className="w-11 h-11 flex items-center justify-center mb-5"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-primary)",
                  }}
                >
                  <f.icon size={20} strokeWidth={1.6} />
                </div>
                <h3
                  className="font-serif text-[22px] mb-2.5 tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-[15px] leading-relaxed max-w-md"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-3 border-t"
        style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
      >
        <p className="text-[13px]">Hecho con precisión por Ameizin.</p>
        <p className="text-eyebrow">ameiz.in</p>
      </footer>
    </main>
  );
}
