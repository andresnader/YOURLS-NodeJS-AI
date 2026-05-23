"use client";

type Props = {
  countries: Record<string, number>;
  cities: Record<string, number>;
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  EC: "Ecuador",
  ES: "Spain",
  MX: "Mexico",
  AR: "Argentina",
  CO: "Colombia",
  BR: "Brazil",
  CL: "Chile",
  PE: "Peru",
  VE: "Venezuela",
  UY: "Uruguay",
  PY: "Paraguay",
  BO: "Bolivia",
  CR: "Costa Rica",
  PA: "Panama",
  GT: "Guatemala",
  HN: "Honduras",
  SV: "El Salvador",
  NI: "Nicaragua",
  DO: "Dominican Republic",
  CU: "Cuba",
  PR: "Puerto Rico",
  CA: "Canada",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  PT: "Portugal",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CZ: "Czechia",
  IE: "Ireland",
  GR: "Greece",
  TR: "Turkey",
  RU: "Russia",
  UA: "Ukraine",
  IL: "Israel",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  EG: "Egypt",
  MA: "Morocco",
  ZA: "South Africa",
  NG: "Nigeria",
  KE: "Kenya",
  IN: "India",
  CN: "China",
  JP: "Japan",
  KR: "South Korea",
  TH: "Thailand",
  VN: "Vietnam",
  ID: "Indonesia",
  PH: "Philippines",
  MY: "Malaysia",
  SG: "Singapore",
  AU: "Australia",
  NZ: "New Zealand",
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
        No geographic data captured yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-3">
        <p className="text-eyebrow">Top countries</p>
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
        <p className="text-eyebrow">Top cities</p>
        {sortedCities.length === 0 ? (
          <p
            className="text-[13px] py-4"
            style={{ color: "var(--text-muted)" }}
          >
            City data only available for clicks captured after the geo update.
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
