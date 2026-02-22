"use client";

import React, { useEffect, useState, useCallback } from "react";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
}

interface BannerCarouselProps {
  isAdmin?: boolean;
  onManage?: () => void;
}

export default function BannerCarousel({ isAdmin, onManage }: BannerCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch("/api/banners");
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goTo = (index: number) => setCurrent(index);
  const goPrev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % banners.length);

  if (loading) {
    return (
      <div className="w-full h-48 md:h-56 lg:h-64 rounded-2xl bg-slate-100 animate-pulse mb-8" />
    );
  }

  // No banners — show placeholder for admin, nothing for employee
  if (banners.length === 0) {
    if (isAdmin) {
      return (
        <div
          onClick={onManage}
          className="w-full h-48 md:h-56 lg:h-64 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-3 mb-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-4xl text-slate-300">add_photo_alternate</span>
          <span className="text-sm font-bold text-slate-400">คลิกเพื่อเพิ่ม Banner</span>
          <span className="text-xs text-slate-300">แนะนำขนาด 1200 x 300 px</span>
        </div>
      );
    }
    return null;
  }

  const banner = banners[current];

  const Wrapper = banner.linkUrl
    ? ({ children, className }: { children: React.ReactNode; className: string }) => (
        <a href={banner.linkUrl!} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
      )
    : ({ children, className }: { children: React.ReactNode; className: string }) => (
        <div className={className}>{children}</div>
      );

  return (
    <div className="relative w-full mb-8 group">
      <Wrapper className="block w-full h-48 md:h-56 lg:h-64 rounded-2xl overflow-hidden relative">
        {/* Image */}
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover transition-transform duration-500"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {/* Title */}
        <div className="absolute bottom-4 left-5 right-5">
          <h3 className="text-white text-lg font-bold drop-shadow-lg">{banner.title}</h3>
        </div>
      </Wrapper>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <span className="material-symbols-outlined text-slate-700 text-lg">chevron_left</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <span className="material-symbols-outlined text-slate-700 text-lg">chevron_right</span>
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}

      {/* Admin manage button */}
      {isAdmin && (
        <button
          onClick={onManage}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">settings</span>
          จัดการ Banner
        </button>
      )}
    </div>
  );
}
