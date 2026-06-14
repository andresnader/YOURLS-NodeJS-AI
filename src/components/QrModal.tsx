"use client";

import { useRef, useState } from "react";
import { X, Copy, Download, ImagePlus, Trash2 } from "lucide-react";
import QRCode from "react-qr-code";
import { useToast } from "./Toast";

interface QrModalProps {
  keyword: string;
  onClose: () => void;
}

const SIZE_OPTIONS = [
  { label: "Small", value: 256 },
  { label: "Medium", value: 512 },
  { label: "Large", value: 1024 },
];

export default function QrModal({ keyword, onClose }: QrModalProps) {
  const { toast } = useToast();
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const [fgColor, setFgColor] = useState("#1a2332");
  const [exportSize, setExportSize] = useState(512);
  const [logo, setLogo] = useState<string | null>(null); // data URL

  const shortUrl =
    typeof window !== "undefined" ? `${window.location.origin}/${keyword}` : `/${keyword}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast("Short URL copied", "success");
    } catch {
      toast("Failed to copy", "error");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      toast("Logo must be under 512 KB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Returns a standalone, scaled SVG string with the logo embedded (if any).
  const buildSvgString = (size: number): string | null => {
    const sourceSvg = svgWrapRef.current?.querySelector("svg");
    if (!sourceSvg) return null;

    const clone = sourceSvg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(size));
    clone.setAttribute("height", String(size));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    if (logo) {
      const ns = "http://www.w3.org/2000/svg";
      // viewBox is "0 0 vb vb" — work in that coordinate space.
      const vb = clone.viewBox.baseVal?.width || size;
      const logoSize = vb * 0.24;
      const pad = logoSize * 0.12;
      const pos = (vb - logoSize) / 2;

      const bg = document.createElementNS(ns, "rect");
      bg.setAttribute("x", String(pos - pad));
      bg.setAttribute("y", String(pos - pad));
      bg.setAttribute("width", String(logoSize + pad * 2));
      bg.setAttribute("height", String(logoSize + pad * 2));
      bg.setAttribute("rx", String(pad));
      bg.setAttribute("fill", "#ffffff");
      clone.appendChild(bg);

      const img = document.createElementNS(ns, "image");
      img.setAttribute("x", String(pos));
      img.setAttribute("y", String(pos));
      img.setAttribute("width", String(logoSize));
      img.setAttribute("height", String(logoSize));
      img.setAttributeNS("http://www.w3.org/1999/xlink", "href", logo);
      img.setAttribute("href", logo);
      clone.appendChild(img);
    }

    return new XMLSerializer().serializeToString(clone);
  };

  const triggerDownload = (href: string, ext: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = `qr-${keyword}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadSvg = () => {
    const svg = buildSvgString(exportSize);
    if (!svg) return toast("QR not ready", "error");
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "svg");
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const svg = buildSvgString(exportSize);
    if (!svg) return toast("QR not ready", "error");

    const img = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = exportSize;
      canvas.height = exportSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return toast("Canvas not supported", "error");
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportSize, exportSize);
      ctx.drawImage(img, 0, 0, exportSize, exportSize);
      URL.revokeObjectURL(url);
      try {
        canvas.toBlob((blob) => {
          if (!blob) return toast("Export failed", "error");
          const pngUrl = URL.createObjectURL(blob);
          triggerDownload(pngUrl, "png");
          URL.revokeObjectURL(pngUrl);
        }, "image/png");
      } catch {
        toast("Export failed", "error");
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast("Export failed", "error");
    };
    img.src = url;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(26, 35, 50, 0.55)" }}
      onClick={onClose}
    >
      <div
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
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded cursor-pointer transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} strokeWidth={1.75} />
        </button>

        <h3 className="font-serif text-[22px] mb-1" style={{ color: "var(--text-primary)" }}>
          QR Code
        </h3>
        <span className="badge-cyber">/{keyword}</span>

        {/* Preview */}
        <div className="flex justify-center my-6">
          <div
            ref={svgWrapRef}
            className="p-5 relative"
            style={{ background: "#FFFFFF", borderRadius: "var(--radius-md)" }}
          >
            <QRCode
              value={shortUrl}
              size={200}
              fgColor={fgColor}
              bgColor="#FFFFFF"
              level={logo ? "H" : "M"}
            />
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt="logo"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded"
                style={{ width: 48, height: 48, background: "#fff", padding: 4 }}
              />
            )}
          </div>
        </div>

        {/* Customization */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <label className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Color
            </label>
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Export size
            </label>
            <div className="flex gap-1.5">
              {SIZE_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setExportSize(s.value)}
                  className="px-2.5 py-1 text-[12px] rounded cursor-pointer transition-colors border"
                  style={{
                    borderColor: "var(--border)",
                    background: exportSize === s.value ? "var(--color-primary)" : "transparent",
                    color: exportSize === s.value ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Center logo
            </label>
            {logo ? (
              <button
                onClick={() => setLogo(null)}
                className="btn-ghost text-[12px] py-1 px-2.5"
              >
                <Trash2 size={13} strokeWidth={1.75} /> Remove
              </button>
            ) : (
              <label className="btn-ghost text-[12px] py-1 px-2.5 cursor-pointer">
                <ImagePlus size={13} strokeWidth={1.75} /> Upload
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 mt-6">
          <button onClick={downloadPng} className="btn-primary py-2.5 text-[13px]">
            <Download size={14} strokeWidth={1.75} /> PNG
          </button>
          <button onClick={downloadSvg} className="btn-primary py-2.5 text-[13px]">
            <Download size={14} strokeWidth={1.75} /> SVG
          </button>
        </div>
        <button onClick={handleCopy} className="btn-ghost w-full py-2.5 text-[13px] mt-2.5">
          <Copy size={14} strokeWidth={1.75} /> Copy short URL
        </button>
      </div>
    </div>
  );
}
