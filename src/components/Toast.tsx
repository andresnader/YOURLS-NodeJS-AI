"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, X, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle size={16} strokeWidth={1.75} style={{ color: "var(--color-success)" }} />,
    error: <XCircle size={16} strokeWidth={1.75} style={{ color: "var(--color-danger)" }} />,
    warning: <AlertTriangle size={16} strokeWidth={1.75} style={{ color: "var(--color-warning)" }} />,
    info: <Info size={16} strokeWidth={1.75} style={{ color: "var(--color-primary)" }} />,
  };

  const accentColors = {
    success: "var(--color-success)",
    error: "var(--color-danger)",
    warning: "var(--color-warning)",
    info: "var(--color-primary)",
  };

  return (
    <div
      className="pointer-events-auto animate-slide-up flex items-center gap-3 px-4 py-3 border"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        borderLeft: `3px solid ${accentColors[toast.type]}`,
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-pop)",
        minWidth: "300px",
        maxWidth: "440px",
      }}
    >
      {icons[toast.type]}
      <span className="text-[13px] flex-1" style={{ color: "var(--text-primary)" }}>
        {toast.message}
      </span>
      <button
        onClick={onDismiss}
        className="p-1 transition-colors shrink-0 cursor-pointer"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        aria-label="Dismiss"
      >
        <X size={13} strokeWidth={1.75} />
      </button>
    </div>
  );
}
