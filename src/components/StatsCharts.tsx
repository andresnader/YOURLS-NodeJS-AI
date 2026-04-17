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
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

export default function StatsCharts({ data }: { data: StatsData }) {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(4, 6, 9, 0.9)',
        titleColor: '#00F0FF',
        borderColor: 'rgba(0, 240, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } },
      },
    },
  };

  const lineData = {
    labels: Object.keys(data.timeSeries),
    datasets: [
      {
        fill: true,
        label: 'Clicks',
        data: Object.values(data.timeSeries),
        borderColor: '#00F0FF',
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: '#00F0FF',
        pointRadius: 4,
      },
    ],
  };

  const donutConfig = (labels: string[], values: number[], colors: string[]) => ({
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 2,
      },
    ],
  });

  const neonColors = ['#00F0FF', '#A855F7', '#FBBF24', '#F87171', '#34D399', '#60A5FA'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Time Series Chart */}
      <div className="md:col-span-2 lg:col-span-3 glass p-6 rounded-2xl">
        <h3 className="text-sm font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00F0FF' }}></span>
          Click Velocity (Last 7 Days)
        </h3>
        <div className="h-64">
          <Line options={chartOptions} data={lineData} />
        </div>
      </div>

      {/* Browsers */}
      <div className="glass p-6 rounded-2xl">
        <h3 className="text-sm font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#A855F7' }}></span>
          Browsers
        </h3>
        <div className="h-48 relative">
          <Doughnut 
            data={donutConfig(Object.keys(data.browsers), Object.values(data.browsers), neonColors)}
            options={{ maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 }, usePointStyle: true } } } }}
          />
        </div>
      </div>

      {/* OS */}
      <div className="glass p-6 rounded-2xl">
        <h3 className="text-sm font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FBBF24' }}></span>
          Operating Systems
        </h3>
        <div className="h-48 relative">
          <Doughnut 
            data={donutConfig(Object.keys(data.os), Object.values(data.os), neonColors.slice().reverse())}
            options={{ maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 }, usePointStyle: true } } } }}
          />
        </div>
      </div>

      {/* Devices */}
      <div className="glass p-6 rounded-2xl">
        <h3 className="text-sm font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F87171' }}></span>
          Devices
        </h3>
        <div className="h-48 relative">
          <Doughnut 
            data={donutConfig(Object.keys(data.devices), Object.values(data.devices), ['#00F0FF', '#A855F7', '#FBBF24'])}
            options={{ maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 }, usePointStyle: true } } } }}
          />
        </div>
      </div>
    </div>
  );
}
