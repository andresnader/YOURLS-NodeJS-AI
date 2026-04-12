"use client";

import { useState } from "react";
import { ExternalLink, BarChart, Clock, Trash2, Edit2, QrCode, X } from "lucide-react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";

// Utilidad simple para formato reactivo de tiempo convertida a cliente
function timeAgo(date: Date | string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export default function LinkCard({ urlItem }: { urlItem: any }) {
  const [showQR, setShowQR] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    try {
      await fetch(`/api/shorten/${urlItem.keyword}`, { method: 'DELETE' });
      router.refresh(); // Refresh RSC
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 flex items-center justify-between group transition-all hover:bg-black/5 dark:hover:bg-white/10 dark:text-white">
      <div className="flex items-center gap-6 overflow-hidden pr-4">
        <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0">
          <ExternalLink size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
        </div>
        <div className="overflow-hidden">
          <a href={`/${urlItem.keyword}`} target="_blank" className="font-bold text-xl text-[var(--color-primary)] tracking-wide hover:underline block truncate">
            refr.ac/{urlItem.keyword}
          </a>
          <p className="text-gray-500 text-sm mt-1 truncate max-w-md">{urlItem.url}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6 shrink-0">
         <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 mr-2">
            <div className="flex items-center gap-2">
            <BarChart size={16} />
            <span>{urlItem.clicks.toLocaleString()} clicks</span>
            </div>
            <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{timeAgo(urlItem.createdAt)}</span>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-700 pl-4">
            <button onClick={() => setShowQR(true)} title="Generate QR CODE" className="p-2 hover:bg-[var(--color-primary)] hover:text-black rounded-lg transition-colors text-gray-500 dark:text-gray-400">
              <QrCode size={18} />
            </button>
            <button title="Edit Link Destination" className="p-2 hover:bg-blue-500 hover:text-white rounded-lg transition-colors text-gray-500 dark:text-gray-400">
              <Edit2 size={18} />
            </button>
            <button onClick={handleDelete} title="Delete Link" className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors text-gray-500 dark:text-gray-400">
              <Trash2 size={18} />
            </button>
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowQR(false)}>
           <div className="bg-white p-8 rounded-2xl flex flex-col items-center gap-4 relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowQR(false)} className="absolute top-2 right-2 p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors">
                 <X size={24} />
              </button>
              <h3 className="text-xl font-bold text-black mb-2 mt-4">QR Code: {urlItem.keyword}</h3>
              <div className="p-4 bg-white rounded-xl shadow-[0_0_15px_-3px_rgba(0,0,0,0.1)]">
                <QRCode value={`${window.location.origin}/${urlItem.keyword}`} size={220} />
              </div>
              <p className="text-sm text-gray-500 mt-2 truncate w-64 text-center font-medium bg-gray-100 px-3 py-1 rounded-full">
                  {window.location.host}/{urlItem.keyword}
              </p>
           </div>
        </div>
      )}
    </div>
  );
}
