"use client";

import { useEffect, useState } from "react";

export default function BackgroundSlider() {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    // We use a timestamp to force a new image on every load
    const collections = ["nature", "landscape", "mountains", "forest", "cosmos"];
    const randomCollection = collections[Math.floor(Math.random() * collections.length)];
    const url = `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000`; // Default high-res landscape
    
    // For real variety, we can use the Unsplash Source API or similar
    // Note: source.unsplash.com is deprecated but still works for many. 
    // We'll use a curated high-res nature image as base and then attempt variety.
    const varietyUrl = `https://source.unsplash.com/featured/?nature,landscape,dark&sig=${Date.now()}`;
    
    setImageUrl(varietyUrl);
  }, []);

  if (!imageUrl) return <div className="fixed inset-0 bg-[#040609]" />;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 animate-float-bg"
        style={{ 
          backgroundImage: `url(${imageUrl})`,
          opacity: 0.6
        }}
      />
      {/* Dark gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#040609]/80 via-transparent to-[#040609]/90" />
      <div className="absolute inset-0 bg-[#040609]/20 backdrop-blur-[2px]" />
    </div>
  );
}
