"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatsData {
  keyword: string;
  longUrl: string;
  totalClicks: number;
  timeSeries: Record<string, number>;
  browsers: Record<string, number>;
  os: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
}

/**
 * Read theme tokens at render time so charts adapt to light/dark.
 * Charts are canvas-only so they can't inherit CSS vars natively.
 */
function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export default function StatsCharts({ data }: { data: StatsData }) {
  const primary = readToken("--color-primary", "#0E7490");
  const textPrimary = readToken("--text-primary", "#1A2332");
  const textMuted = readToken("--text-muted", "#6B7385");
  const surface = readToken("--bg-surface", "#FFFFFF");
  const border = readToken("--border", "rgba(26,35,50,0.14)");

  /** Editorial palette — single hue with luminance steps, plus warm accent for emphasis */
  const editorialPalette = [
    "#0E7490", // teal-700
    "#155E75", // teal-800
    "#164E63", // teal-900
    "#B45309", // amber-700
    "#92400E", // amber-800
    "#6B7385", // neutral ink
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: surface,
        titleColor: textPrimary,
        bodyColor: textPrimary,
        borderColor: border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        titleFont: { family: "Inter", weight: 600, size: 12 },
        bodyFont: { family: "Inter", size: 12 },
      },
    },
    scales: {
      y: {
        grid: { color: border, drawBorder: false },
        ticks: {
          color: textMuted,
          font: { family: "Inter", size: 11 },
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: textMuted,
          font: { family: "Inter", size: 11 },
        },
      },
    },
  };

  const lineData = {
    labels: Object.keys(data.timeSeries),
    datasets: [
      {
        fill: true,
        label: "Clicks",
        data: Object.values(data.timeSeries),
        borderColor: primary,
        backgroundColor: `${primary}1A`, // ~10% alpha
        tension: 0.35,
        borderWidth: 1.5,
        pointBackgroundColor: primary,
        pointBorderColor: surface,
        pointBorderWidth: 1.5,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const donutConfig = (labels: string[], values: number[]) => ({
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: editorialPalette,
        borderColor: surface,
        borderWidth: 2,
      },
    ],
  });

  const donutOpts = {
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          color: textMuted,
          font: { family: "Inter", size: 11 },
          usePointStyle: true,
          boxWidth: 6,
          boxHeight: 6,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: surface,
        titleColor: textPrimary,
        bodyColor: textPrimary,
        borderColor: border,
        borderWidth: 1,
        cornerRadius: 6,
        bodyFont: { family: "Inter", size: 12 },
      },
    },
  };

  const cardStyle = {
    background: surface,
    border: `1px solid ${border}`,
    borderRadius: "var(--radius-lg)",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <article
        className="md:col-span-2 lg:col-span-3 p-7"
        style={cardStyle}
      >
        <header className="mb-6">
          <p className="text-eyebrow">Last 7 days</p>
          <h3
            className="font-serif text-[20px] mt-1"
            style={{ color: textPrimary }}
          >
            Click velocity
          </h3>
        </header>
        <div className="h-64">
          <Line options={chartOptions} data={lineData} />
        </div>
      </article>

      {[
        { title: "Browsers", source: data.browsers },
        { title: "Operating systems", source: data.os },
        { title: "Devices", source: data.devices },
      ].map((chart) => (
        <article key={chart.title} className="p-7" style={cardStyle}>
          <header className="mb-6">
            <p className="text-eyebrow">Breakdown</p>
            <h3
              className="font-serif text-[20px] mt-1"
              style={{ color: textPrimary }}
            >
              {chart.title}
            </h3>
          </header>
          <div className="h-52 relative">
            <Doughnut
              data={donutConfig(Object.keys(chart.source), Object.values(chart.source))}
              options={donutOpts}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
