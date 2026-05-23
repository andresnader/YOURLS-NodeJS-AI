"use client";

import { Bookmark } from "lucide-react";

export default function Bookmarklet() {
  const bookmarkletCode = `javascript:void(function(){window.open('${
    typeof window !== "undefined" ? window.location.origin : ""
  }/admin?url='+encodeURIComponent(document.location.href)+'&title='+encodeURIComponent(document.title),'_blank','width=600,height=400')})()`;

  return (
    <div
      className="p-6 border"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="flex items-start gap-4">
        <Bookmark
          size={18}
          strokeWidth={1.5}
          className="mt-0.5"
          style={{ color: "var(--color-primary)" }}
        />
        <div className="flex-1 min-w-0">
          <h3
            className="font-serif text-[18px] mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Quick shorten bookmarklet
          </h3>
          <p
            className="text-[13px] mb-4 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Drag the button below to your bookmarks bar to instantly shorten the
            page you are viewing.
          </p>
          <a
            href={bookmarkletCode}
            className="btn-primary inline-flex items-center gap-2 text-[13px] px-4 py-2"
            onClick={(e) => {
              e.preventDefault();
              alert("Drag this button to your bookmarks bar!");
            }}
            title="Drag me to bookmarks bar!"
          >
            <Bookmark size={13} strokeWidth={1.75} />
            YOURLS It
          </a>
        </div>
      </div>
    </div>
  );
}
