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
    success: <CheckCircle size={18} style={{ color: "var(--color-success)" }} />,
    error: <XCircle size={18} style={{ color: "var(--color-danger)" }} />,
    warning: <AlertTriangle size={18} style={{ color: "var(--color-warning)" }} />,
    info: <Info size={18} style={{ color: "#00F0FF" }} />,
  };

  const accentColors = {
    success: "var(--color-success)",
    error: "var(--color-danger)",
    warning: "var(--color-warning)",
    info: "#00F0FF",
  };

  return (
    <div
      className="pointer-events-auto animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(24px)",
        border: "1px solid var(--border-glass)",
        borderLeft: `3px solid ${accentColors[toast.type]}`,
        boxShadow: "var(--shadow-deep)",
        minWidth: "300px",
        maxWidth: "440px",
      }}
    >
      {icons[toast.type]}
      <span className="text-sm font-medium flex-1" style={{ color: "var(--text-primary)" }}>
        {toast.message}
      </span>
      <button
        onClick={onDismiss}
        className="p-1 rounded-md transition-colors shrink-0"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
      >
        <X size={14} />
      </button>
    </div>
  );
}
