"use client";

import { Info } from "lucide-react";

/**
 * Friendly, jargon-free explainer for the redirect type choice. Shown below
 * the 301/302 selector in both the create form and the edit modal.
 */
export default function RedirectTypeHelp() {
  return (
    <div
      className="flex gap-2.5 p-3 border"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-soft)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <Info
        size={15}
        strokeWidth={1.75}
        className="shrink-0 mt-0.5"
        style={{ color: "var(--color-primary)" }}
      />
      <div className="space-y-1.5 text-[12px] leading-relaxed">
        <p style={{ color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            Permanente:
          </span>{" "}
          para enlaces que siempre llevarán al mismo lugar. Es la opción que casi
          siempre quieres. 👍
        </p>
        <p style={{ color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            Temporal:
          </span>{" "}
          úsala si piensas cambiar el destino más adelante, como una promoción
          que cambia cada temporada. 🔄
        </p>
      </div>
    </div>
  );
}
