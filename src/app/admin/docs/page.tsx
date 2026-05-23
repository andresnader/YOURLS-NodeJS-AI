"use client";

import { useTranslation } from "@/lib/LanguageContext";
import { BookOpen, Link2, Users, Key, BarChart3, Globe, QrCode, Search, Trash2, Copy, ExternalLink, Shield, Loader2 } from "lucide-react";

const sections = [
  {
    id: "overview",
    title: "overview",
    icon: BookOpen,
    color: "#10B981",
    content: {
      en: {
        title: "What is YOURLS Node?",
        text: "YOURLS Node is a self-hosted URL shortener with AI capabilities. It allows you to create short links, track clicks, manage users, and generate QR codes. Perfect for brands, marketers, and developers who need full control over their links."
      },
      es: {
        title: "¿Qué es YOURLS Node?",
        text: "YOURLS Node es un acortador de URLs auto-hosteado con capacidades de IA. Te permite crear links cortos, rastrear clics, gestionar usuarios y generar códigos QR. Perfecto para marcas, marketers y desarrolladores que necesitan control total sobre sus enlaces."
      }
    }
  },
  {
    id: "creating-links",
    title: "create_link",
    icon: Link2,
    color: "#00F0FF",
    content: {
      en: {
        title: "Creating Your First Short Link",
        text: "Navigate to the main dashboard and fill in the shorten form. Enter your long URL, optionally add a custom keyword, and click Create. Your short link will be ready instantly.",
        steps: [
          "Go to Dashboard (main page)",
          "Paste or type your long URL",
          "Optional: Enter a custom keyword (e.g., my-link)",
          "Click Create to generate your short URL"
        ]
      },
      es: {
        title: "Creando Tu Primer Link Corto",
        text: "Navega al panel principal y completa el formulario. Ingresa tu URL larga, opcionalmente añade una palabra clave personalizada, y haz clic en Crear. Tu link corto estará listo al instante.",
        steps: [
          "Ve al Panel de Control (página principal)",
          "Pega o escribe tu URL larga",
          "Opcional: Ingresa una palabra clave personalizada (ej: mi-link)",
          "Haz clic en Crear para generar tu URL corta"
        ]
      }
    }
  },
  {
    id: "managing-links",
    title: "manage_links",
    icon: Search,
    color: "#A855F7",
    content: {
      en: {
        title: "Managing Your Links",
        text: "All your shortened links appear in the Links table. You can search, sort, and filter to find specific links. Each link has actions: view details, copy URL, open target, or delete.",
        actions: [
          { icon: Copy, label: "Copy URL", desc: "Copy short link to clipboard" },
          { icon: ExternalLink, label: "Open", desc: "Visit the short link destination" },
          { icon: BarChart3, label: "Stats", desc: "View click statistics for this link" },
          { icon: Trash2, label: "Delete", desc: "Permanently remove this link" }
        ]
      },
      es: {
        title: "Gestionando Tus Links",
        text: "Todos tus links acortados aparecen en la tabla de Links. Puedes buscar, ordenar y filtrar para encontrar links específicos. Cada link tiene acciones: ver detalles, copiar URL, abrir destino, o eliminar.",
        actions: [
          { icon: Copy, label: "Copiar", desc: "Copiar link corto al portapapeles" },
          { icon: ExternalLink, label: "Abrir", desc: "Visitar el destino del link corto" },
          { icon: BarChart3, label: "Estadísticas", desc: "Ver estadísticas de clics de este link" },
          { icon: Trash2, label: "Eliminar", desc: "Remover este link permanentemente" }
        ]
      }
    }
  },
  {
    id: "qr-codes",
    title: "qr_codes",
    icon: QrCode,
    color: "#EC4899",
    content: {
      en: {
        title: "Generating QR Codes",
        text: "Each shortened link includes an auto-generated QR code. Find it in the link details or use the Bookmarklet tool to generate QR codes for any URL on the fly.",
        tip: "The QR code updates automatically when you update the target URL of a link."
      },
      es: {
        title: "Generando Códigos QR",
        text: "Cada link acortado incluye un código QR auto-generado. Encuéntralo en los detalles del link o usa la herramienta Bookmarklet para generar códigos QR para cualquier URL al instante.",
        tip: "El código QR se actualiza automáticamente cuando actualizas la URL destino de un link."
      }
    }
  },
  {
    id: "api-keys",
    title: "api_access",
    icon: Key,
    color: "#F59E0B",
    content: {
      en: {
        title: "Using the API",
        text: "Generate API keys to integrate YOURLS Node with your apps. Go to API Keys section, create a new key with a name, and use it in your HTTP requests.",
        example: {
          title: "Example API Request",
          code: `curl -X POST https://ameiz.in/api/shorten \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`
        }
      },
      es: {
        title: "Usando la API",
        text: "Genera claves API para integrar YOURLS Node con tus aplicaciones. Ve a la sección de Claves API, crea una nueva clave con un nombre, y úsala en tus solicitudes HTTP.",
        example: {
          title: "Ejemplo de Solicitud API",
          code: `curl -X POST https://ameiz.in/api/shorten \\
  -H "x-api-key: TU_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://ejemplo.com"}'`
        }
      }
    }
  },
  {
    id: "multitenant",
    title: "multi_tenant",
    icon: Users,
    color: "#8B5CF6",
    content: {
      en: {
        title: "Multi-Tenant System",
        text: "Each user can only see and manage their own links. Administrators have access to all links and global statistics. This ensures privacy and organization in team environments.",
        features: [
          "Users see only their own links",
          "Admins access all links globally",
          "Statistics are scoped per user",
          "API keys are user-specific"
        ]
      },
      es: {
        title: "Sistema Multi-Inquilino",
        text: "Cada usuario puede ver y gestionar solo sus propios links. Los administradores tienen acceso a todos los links y estadísticas globales. Esto asegura privacidad y organización en equipos.",
        features: [
          "Usuarios ven solo sus propios links",
          "Admins acceden a todos los links globalmente",
          "Estadísticas son por usuario",
          "Claves API son específicas por usuario"
        ]
      }
    }
  },
  {
    id: "stats",
    title: "statistics",
    icon: BarChart3,
    color: "#06B6D4",
    content: {
      en: {
        title: "Understanding Statistics",
        text: "Track every click with detailed analytics. The Global Stats page shows aggregate data across all your links, while individual link stats show per-link performance.",
        metrics: [
          { label: "Total Clicks", desc: "Sum of all clicks across links" },
          { label: "Unique Clicks", desc: "Clicks from unique visitors" },
          { label: "Top Links", desc: "Most clicked shortened URLs" },
          { label: "Referrers", desc: "Where your audience comes from" }
        ]
      },
      es: {
        title: "Entendiendo las Estadísticas",
        text: "Rastrea cada clic con análisis detallados. La página de Estadísticas Globales muestra datos agregados de todos tus links, mientras que las estadísticas individuales muestran el rendimiento por link.",
        metrics: [
          { label: "Total de Clics", desc: "Suma de todos los clics en links" },
          { label: "Clics Únicos", desc: "Clics de visitantes únicos" },
          { label: "Links Top", desc: "URLs acortadas más clicadas" },
          { label: "Referentes", desc: "De dónde viene tu audiencia" }
        ]
      }
    }
  },
  {
    id: "security",
    title: "security",
    icon: Shield,
    color: "#EF4444",
    content: {
      en: {
        title: "Security Features",
        text: "YOURLS Node includes multiple security layers to protect your links and data.",
        features: [
          "Domain blacklist blocks malicious URLs",
          "Reserved keywords prevent system conflict",
          "Password-protected links for sensitive content",
          "HTTP-only sessions and secure cookies"
        ]
      },
      es: {
        title: "Características de Seguridad",
        text: "YOURLS Node incluye múltiples capas de seguridad para proteger tus links y datos.",
        features: [
          "Lista negra de dominios bloquea URLs maliciosas",
          "Palabras clave reservadas previenen conflictos del sistema",
          "Links protegidos con contraseña para contenido sensible",
          "Sesiones HTTP-only y cookies seguras"
        ]
      }
    }
  }
];

export default function DocsPage() {
  const { t, language } = useTranslation();
  const lang = language as "en" | "es";

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-14 space-y-12 animate-fade-in">
      <header className="space-y-3">
        <p className="text-eyebrow">{t("common.documentation")}</p>
        <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>
          User guide
        </h1>
        <p
          className="max-w-prose text-[15px] leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {lang === "en"
            ? "Everything you need to know to get the most out of YOURLS Node."
            : "Todo lo que necesitás saber para sacarle el máximo provecho a YOURLS Node."}
        </p>
      </header>

      <hr className="rule" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => {
          const content = section.content[lang];
          const Icon = section.icon;

          return (
            <section
              key={section.id}
              className="p-7 space-y-5 border"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <header className="space-y-3">
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  style={{ color: "var(--color-primary)" }}
                />
                <h2
                  className="font-serif text-[22px] leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {content.title}
                </h2>
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {content.text}
                </p>
              </header>

              {content.steps && (
                <ol className="space-y-2.5">
                  {content.steps.map((step: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-[14px]"
                    >
                      <span
                        className="font-mono text-[12px] tabular-nums shrink-0 mt-0.5"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {content.actions && (
                <div className="grid grid-cols-1 gap-1">
                  {content.actions.map((action: any, i: number) => {
                    const ActionIcon = action.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 py-2"
                        style={{
                          borderTop:
                            i > 0 ? "1px solid var(--border-soft)" : "none",
                          paddingTop: i > 0 ? "0.75rem" : "0.5rem",
                        }}
                      >
                        <ActionIcon
                          size={15}
                          strokeWidth={1.75}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--text-muted)" }}
                        />
                        <div>
                          <p
                            className="text-[13px] font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {action.label}
                          </p>
                          <p
                            className="text-[12px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {action.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {content.features && (
                <ul className="space-y-2">
                  {content.features.map((feature: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[14px]"
                    >
                      <span
                        className="w-1 h-1 rounded-full mt-2.5 shrink-0"
                        style={{ background: "var(--color-primary)" }}
                      />
                      <span style={{ color: "var(--text-secondary)" }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {content.metrics && (
                <div className="grid grid-cols-2 gap-3">
                  {content.metrics.map((metric: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 border"
                      style={{
                        background: "var(--bg-elevated)",
                        borderColor: "var(--border-soft)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <p
                        className="text-[12px] font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {metric.label}
                      </p>
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {metric.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {content.tip && (
                <div
                  className="p-4 flex gap-3 border"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-soft)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <span
                    className="w-1 h-1 rounded-full mt-2 shrink-0"
                    style={{ background: "var(--color-primary)" }}
                  />
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {content.tip}
                  </p>
                </div>
              )}

              {content.example && (
                <div className="space-y-2">
                  <p className="text-eyebrow">{content.example.title}</p>
                  <pre
                    className="p-4 text-[12px] overflow-x-auto border"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border-soft)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <code style={{ color: "var(--color-primary)" }}>
                      {content.example.code}
                    </code>
                  </pre>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <footer className="text-center py-8 border-t border-white/10">
        <p className="text-xs opacity-40">
          {lang === "en" 
            ? "YOURLS Node — Self-hosted URL shortener with AI capabilities" 
            : "YOURLS Node — Acortador de URLs auto-hosteado con capacidades de IA"}
        </p>
        <p className="text-[10px] opacity-20 mt-1">ameiz.in</p>
      </footer>
    </div>
  );
}
