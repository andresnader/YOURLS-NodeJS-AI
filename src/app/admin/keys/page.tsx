"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Trash2, Copy, CheckCircle2, Loader2, Calendar, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/LanguageContext";

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/keys", { credentials: 'include' });
      const data = await res.json();
      if (data.success) setKeys(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      if (data.success) {
        setKeys([data.data, ...keys]);
        setLastCreatedKey(data.data.key);
        setNewKeyName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("common.confirm_delete") || "Are you sure?")) return;
    try {
      const res = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setKeys(keys.filter(k => k.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="px-6 py-8 md:px-10 space-y-8 animate-fade-in relative z-10">
      <header className="relative">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                <Key className="text-pink-500" size={20} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">
                {t("common.api_keys")}
            </h1>
        </div>
        <p className="text-secondary max-w-2xl">
            Gestione sus credenciales para integraciones externas como WordPress, plugins de terceros o automatizaciones personalizadas.
        </p>
      </header>

      <section className="glass rounded-[2rem] p-8 border border-glass shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px] group-hover:bg-pink-500/20 transition-all duration-700" />
        
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-muted">
          <Plus size={14} /> Generar Nueva Clave
        </h2>

        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 relative z-10">
          <div className="flex-1 relative">
            <input 
                type="text" 
                placeholder="Nombre de la clave (ej: WordPress Ameizin)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full bg-void/50 border border-glass rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-muted/50"
                required
            />
          </div>
          <button 
            type="submit" 
            disabled={creating}
            className="bg-primary text-black font-bold px-8 py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creating ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
            Generar Credencial
          </button>
        </form>

        {lastCreatedKey && (
          <div className="mt-8 p-6 rounded-2xl bg-primary/10 border border-primary/20 animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
                <AlertCircle size={40} className="text-primary opacity-20" />
            </div>
            
            <p className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
               <CheckCircle2 size={16} /> Clave Generada con Éxito
            </p>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <code className="w-full flex-1 bg-black/60 p-4 rounded-xl font-mono text-sm break-all border border-white/5 text-pink-400">
                {lastCreatedKey}
              </code>
              <button 
                onClick={() => copyToClipboard(lastCreatedKey)}
                className={`w-full md:w-auto p-4 rounded-xl transition-all flex items-center justify-center gap-2 ${copySuccess ? 'bg-green-500/20 text-green-400' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {copySuccess ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                {copySuccess ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="flex items-start gap-2 mt-4 text-[11px] text-pink-500/80 font-medium uppercase tracking-wider">
              <AlertCircle size={14} className="shrink-0" />
              <span>Importante: Por seguridad, esta es la única vez que verás esta clave completa. Guárdala en un lugar seguro.</span>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 text-muted flex items-center gap-2">
           <ShieldCheck size={14} /> Claves Activas
        </h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 glass rounded-[2rem] border border-glass">
            <Loader2 className="animate-spin text-primary mb-4" size={40} />
            <p className="text-muted animate-pulse">Sincronizando credenciales...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="glass rounded-[2rem] p-16 text-center border border-dashed border-glass/30">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key size={32} className="text-muted/30" />
            </div>
            <p className="text-secondary font-medium">No se han encontrado claves de API.</p>
            <p className="text-muted text-sm mt-1">Crea una clave arriba para empezar a integrar tus sistemas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {keys.map((k) => (
              <div 
                key={k.id}
                className="glass rounded-2xl p-6 border border-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:bg-white/5 transition-all duration-300 hover:border-pink-500/30"
              >
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                        <Key size={24} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg group-hover:text-pink-400 transition-colors">{k.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
                            <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                <Calendar size={12} className="text-pink-500" /> Creada: {new Date(k.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                <Clock size={12} className="text-pink-500" /> 
                                {k.lastUsed ? `Último uso: ${new Date(k.lastUsed).toLocaleString()}` : 'Nunca usada'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                   <button 
                    onClick={() => handleDelete(k.id)}
                    className="flex-1 md:flex-none px-5 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-400/20 group/btn"
                   >
                     <Trash2 size={18} className="group-hover/btn:rotate-12 transition-transform" />
                     <span className="font-medium">Revocar</span>
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
