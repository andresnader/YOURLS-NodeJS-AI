"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, Link2, Type, Hash, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "./Toast";
import RedirectTypeHelp from "./RedirectTypeHelp";

interface UrlItem {
  keyword: string;
  url: string;
  title: string | null;
  redirectType?: number;
  hasPassword?: boolean;
}

interface EditLinkModalProps {
  item: UrlItem;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditLinkModal({ item, onClose, onSaved }: EditLinkModalProps) {
  const { toast } = useToast();
  const [keyword, setKeyword] = useState(item.keyword);
  const [title, setTitle] = useState(item.title || "");
  const [url, setUrl] = useState(item.url);
  const [redirectType, setRedirectType] = useState(item.redirectType ?? 302);
  const [protect, setProtect] = useState(Boolean(item.hasPassword));
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const keywordChanged = keyword.trim() !== item.keyword;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side URL validation before hitting the network.
    try {
      new URL(url);
    } catch {
      toast("Ingresa una URL válida (incluyendo https://)", "error");
      return;
    }

    const body: Record<string, unknown> = {};
    if (url !== item.url) body.url = url;
    if (title !== (item.title || "")) body.title = title || null;
    if (redirectType !== (item.redirectType ?? 302)) body.redirectType = redirectType;
    if (keywordChanged) body.keyword = keyword.trim();

    // Password logic:
    //  - protection turned off → clear it
    //  - protection on with a new value → set it
    //  - protection on, empty input, already protected → leave untouched
    if (!protect && item.hasPassword) {
      body.password = "";
    } else if (protect && password) {
      body.password = password;
    } else if (protect && !password && !item.hasPassword) {
      toast("Ingresa una contraseña o desactiva la protección", "error");
      return;
    }

    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/shorten/${item.keyword}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Enlace actualizado", "success");
        onSaved();
      } else {
        toast(data.error || "No se pudo actualizar el enlace", "error");
        setSaving(false);
      }
    } catch {
      toast("Error de conexión", "error");
      setSaving(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(26, 35, 50, 0.55)" }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSave}
        className="p-7 relative max-w-md w-full border max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-deep)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 p-1.5 rounded cursor-pointer transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} strokeWidth={1.75} />
        </button>

        <h3 className="font-serif text-[22px] mb-6" style={{ color: "var(--text-primary)" }}>
          Editar enlace
        </h3>

        <div className="space-y-5">
          {/* Keyword */}
          <div className="space-y-2">
            <label className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Hash size={13} strokeWidth={1.75} /> Palabra clave
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input-glass text-[14px] font-mono"
              placeholder="mi-enlace"
            />
            {keywordChanged && (
              <p className="text-[12px] flex items-start gap-1.5" style={{ color: "var(--color-warning, #b45309)" }}>
                <AlertTriangle size={13} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                Cambiar la palabra clave modifica el enlace corto. El historial de clics se conserva, pero el enlace anterior dejará de funcionar.
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Type size={13} strokeWidth={1.75} /> Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-glass text-[14px]"
              placeholder="Título opcional"
            />
          </div>

          {/* Destination URL */}
          <div className="space-y-2">
            <label className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Link2 size={13} strokeWidth={1.75} /> URL de destino
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input-glass text-[14px]"
              placeholder="https://ejemplo.com"
              required
            />
          </div>

          {/* Redirect type */}
          <div className="space-y-2">
            <label className="text-[12px] font-medium block" style={{ color: "var(--text-muted)" }}>
              Tipo de redirección
            </label>
            <select
              value={redirectType}
              onChange={(e) => setRedirectType(Number(e.target.value))}
              className="input-glass text-[14px] cursor-pointer"
            >
              <option value={301}>Permanente (301)</option>
              <option value={302}>Temporal (302)</option>
            </select>
            <RedirectTypeHelp />
          </div>

          {/* Password protection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={protect}
                onChange={(e) => setProtect(e.target.checked)}
                style={{ accentColor: "var(--color-primary)" }}
              />
              <span className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                <Shield size={13} strokeWidth={1.75} /> Proteger con contraseña
              </span>
            </label>
            {protect && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glass text-[14px]"
                placeholder={item.hasPassword ? "Déjalo vacío para mantener la actual" : "Define una contraseña"}
                autoComplete="new-password"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-7">
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-[14px]">
            {saving ? (
              <>
                <Loader2 size={15} strokeWidth={1.75} className="animate-spin" /> Guardando…
              </>
            ) : (
              <>
                <Check size={15} strokeWidth={1.75} /> Guardar cambios
              </>
            )}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost py-2.5 px-5 text-[14px]">
            Cancelar
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
