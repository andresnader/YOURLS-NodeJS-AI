"use client";

type Props = {
  countries: Record<string, number>;
  cities: Record<string, number>;
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "Estados Unidos",
  EC: "Ecuador",
  ES: "España",
  MX: "México",
  AR: "Argentina",
  CO: "Colombia",
  BR: "Brasil",
  CL: "Chile",
  PE: "Perú",
  VE: "Venezuela",
  UY: "Uruguay",
  PY: "Paraguay",
  BO: "Bolivia",
  CR: "Costa Rica",
  PA: "Panamá",
  GT: "Guatemala",
  HN: "Honduras",
  SV: "El Salvador",
  NI: "Nicaragua",
  DO: "República Dominicana",
  CU: "Cuba",
  PR: "Puerto Rico",
  CA: "Canadá",
  GB: "Reino Unido",
  DE: "Alemania",
  FR: "Francia",
  IT: "Italia",
  PT: "Portugal",
  NL: "Países Bajos",
  BE: "Bélgica",
  CH: "Suiza",
  AT: "Austria",
  SE: "Suecia",
  NO: "Noruega",
  DK: "Dinamarca",
  FI: "Finlandia",
  PL: "Polonia",
  CZ: "Chequia",
  IE: "Irlanda",
  GR: "Grecia",
  TR: "Turquía",
  RU: "Rusia",
  UA: "Ucrania",
  IL: "Israel",
  AE: "Emiratos Árabes Unidos",
  SA: "Arabia Saudita",
  EG: "Egipto",
  MA: "Marruecos",
  ZA: "Sudáfrica",
  NG: "Nigeria",
  KE: "Kenia",
  IN: "India",
  CN: "China",
  JP: "Japón",
  KR: "Corea del Sur",
  TH: "Tailandia",
  VN: "Vietnam",
  ID: "Indonesia",
  PH: "Filipinas",
  MY: "Malasia",
  SG: "Singapur",
  AU: "Australia",
  NZ: "Nueva Zelanda",
};

function flag(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

export default function GeoChart({ countries, cities }: Props) {
  const sortedCountries = Object.entries(countries)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  const total = sortedCountries.reduce((s, [, n]) => s + n, 0);

  const sortedCities = Object.entries(cities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  if (sortedCountries.length === 0) {
    return (
      <p
        className="text-[13px] py-8 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        Aún no hay datos geográficos registrados.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-3">
        <p className="text-eyebrow">Países principales</p>
        <ul className="space-y-2.5">
          {sortedCountries.map(([code, n]) => {
            const pct = total > 0 ? (n / total) * 100 : 0;
            return (
              <li key={code} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                <span className="text-[18px] leading-none">{flag(code)}</span>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-[13px] truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {COUNTRY_NAMES[code] || code}
                    </span>
                    <span
                      className="font-mono text-[12px] tabular-nums shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="h-1 mt-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--border-soft)" }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        background: "var(--color-primary)",
                      }}
                    />
                  </div>
                </div>
                <span
                  className="font-mono text-[13px] tabular-nums shrink-0"
                  style={{ color: "var(--text-primary)" }}
                >
                  {n.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-3">
        <p className="text-eyebrow">Ciudades principales</p>
        {sortedCities.length === 0 ? (
          <p
            className="text-[13px] py-4"
            style={{ color: "var(--text-muted)" }}
          >
            Los datos de ciudad solo están disponibles para clics registrados tras la actualización geográfica.
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedCities.map(([city, n]) => (
              <li
                key={city}
                className="flex items-baseline justify-between gap-3 py-1.5"
                style={{ borderBottom: "1px solid var(--border-soft)" }}
              >
                <span
                  className="text-[13px] truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {city}
                </span>
                <span
                  className="font-mono text-[13px] tabular-nums"
                  style={{ color: "var(--text-muted)" }}
                >
                  {n.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
