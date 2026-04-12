import { Sparkles } from "lucide-react";
import prisma from "@/lib/prisma";
import ShortenForm from "@/components/ShortenForm";
import LinkCard from "@/components/LinkCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";

export const revalidate = 0;


export default async function Home() {
  const urls = await prisma.url.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return (
    <main className="min-h-screen p-8 flex flex-col items-center relative overflow-hidden">
      {/* Decorative ambient flares behind glass */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-primary)]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-primary-dim)]/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar Minimalista */}
      <nav className="w-full max-w-6xl flex justify-between items-center mb-16 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center p-2">
            <Sparkles className="text-[var(--color-primary)]" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest dark:text-white/90 text-gray-800">REFRACT<span className="text-[var(--color-primary)]">_O</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
             <ThemeToggle />
             <LogoutButton />
        </div>
      </nav>

      {/* Hero Section & Input */}
      <section className="w-full max-w-3xl flex flex-col items-center text-center mb-24 relative z-10">
        <h2 className="text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
          Supercharge your Links
        </h2>
        <p className="text-gray-400 mb-10 text-lg">Shorten, track, and manage your URLs through a stunning refractive experience.</p>
        
        <ShortenForm />
      </section>

      {/* Analytics & Link List */}
      <section className="w-full max-w-6xl relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white/80">Recent Transmissions</h3>
          <button className="text-sm font-medium text-[var(--color-primary)] hover:text-white transition-colors">
            View Vault →
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {urls.length === 0 ? (
            <div className="text-center text-gray-500 py-10 glass-panel rounded-2xl">
              No links shortened yet.
            </div>
          ) : (
            urls.map((urlItem) => (
              <LinkCard key={urlItem.keyword} urlItem={urlItem} />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
