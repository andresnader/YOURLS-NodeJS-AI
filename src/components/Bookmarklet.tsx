"use client";

import { Bookmark, Info } from "lucide-react";

export default function Bookmarklet() {
  const bookmarkletCode = `javascript:void(function(){window.open('${typeof window !== "undefined" ? window.location.origin : ""}/admin?url='+encodeURIComponent(document.location.href)+'&title='+encodeURIComponent(document.title),'_blank','width=600,height=400')})()`;

  return (
    <div className="glass glass-hover rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(0, 240, 255, 0.03))",
            border: "1px solid rgba(0, 240, 255, 0.15)",
          }}
        >
          <Bookmark size={16} style={{ color: "#00F0FF" }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
            Quick Shorten Bookmarklet
          </h3>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Drag this button to your bookmarks bar to instantly shorten any page.
          </p>
          <a
            href={bookmarkletCode}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold no-underline transition-all"
            style={{
              background: "linear-gradient(135deg, #00F0FF, var(--color-primary-dim))",
              color: "#040609",
              boxShadow: "0 0 20px -5px rgba(0, 240, 255, 0.3)",
            }}
            onClick={(e) => {
              e.preventDefault();
              alert("Drag this button to your bookmarks bar!");
            }}
            title="Drag me to bookmarks bar!"
          >
            <Bookmark size={12} />
            YOURLS It!
          </a>
          <div className="flex items-center gap-1.5 mt-2.5">
            <Info size={11} style={{ color: "var(--text-muted)" }} />
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Drag the button above to your bookmarks bar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
