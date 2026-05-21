import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Globe, Calendar, MousePointer2 } from 'lucide-react';
import StatsCharts from '@/components/StatsCharts';
import { getKeywordStats } from '@/lib/stats';

export default async function KeywordStatsPage({ params }: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await params;
  
  return (
    <div className="min-h-screen p-6 md:p-12 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-2 text-xs font-semibold mb-3 hover:translate-x-[-4px] transition-transform"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft size={14} />
              Return to Control Center
            </Link>
            <h1 className="text-3xl font-black tracking-tighter">
              Analytical <span style={{ color: '#00F0FF' }}>Intelligence</span>
            </h1>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Detailed insights for <span className="font-mono text-[#00F0FF]">/{keyword}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href={`/${keyword}`}
              target="_blank"
              className="btn-glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
            >
              <ExternalLink size={16} />
              Visit Link
            </a>
          </div>
        </div>

        <Suspense fallback={<div className="glass p-12 text-center">Initializing deep scan...</div>}>
          <StatsContent keyword={keyword} />
        </Suspense>
      </div>
    </div>
  );
}

async function StatsContent({ keyword }: { keyword: string }) {
  try {
    const data = await getKeywordStats(keyword);
    if (!data) notFound();

    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Total Accumulation" 
            value={data.totalClicks.toLocaleString()} 
            icon={<MousePointer2 size={20} />}
            color="#00F0FF"
          />
          <StatCard 
            label="Unique Domains" 
            value={Object.keys(data.countries).length.toString()} 
            icon={<Globe size={20} />} 
            color="#A855F7"
          />
          <StatCard 
            label="Peak Velocity" 
            value={Math.max(...Object.values(data.timeSeries)).toString()} 
            icon={<Calendar size={20} />} 
            color="#FBBF24"
          />
          <div className="glass p-5 rounded-2xl flex flex-col justify-center">
             <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--text-muted)' }}>Destination</p>
             <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{data.longUrl}</p>
          </div>
        </div>

        {/* Charts Section */}
        <StatsCharts data={data} />
      </div>
    );
  } catch (error) {
    console.error('[stats page]', error);
    return (
      <div className="glass p-12 text-center text-red-400">
        Could not load stats for this keyword. Try again in a moment.
      </div>
    );
  }
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <div className="glass p-5 rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform" style={{ color }}>
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="text-2xl font-black">{value}</div>
      <div className="absolute bottom-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(to right, ${color}, transparent)` }}></div>
    </div>
  );
}
