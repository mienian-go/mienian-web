"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Truck, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Slide {
  id: number;
  badge: string;
  badgeEmoji: string;
  title: React.ReactNode;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  ctaVariant: "primary" | "secondary";
  gradient: string;
  accentGlow: string;
}

const slides: Slide[] = [
  {
    id: 1,
    badge: "Warmindo Keliling",
    badgeEmoji: "🛺",
    title: (
      <>
        Gerobak <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#FFD54F]">Mienian</span> Siap Mangkal!
      </>
    ),
    subtitle: "Bukan warmindo biasa. Fresh cooking, menu variatif, dan antrean yang selalu rame — bukti rasa yang gak pernah bohong.",
    ctaText: "Cari Gerobak",
    ctaLink: "/mienian-go",
    ctaVariant: "secondary",
    gradient: "from-secondary/20 via-background to-background",
    accentGlow: "bg-secondary/15",
  },
  {
    id: 2,
    badge: "Live Cooking Catering",
    badgeEmoji: "🔥",
    title: (
      <>
        Bikin Acara Lo Makin <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#FF6B6B]">Pecah</span>!
      </>
    ),
    subtitle: "Wedding, birthday, corporate — live cooking Indomie premium langsung di venue. Setup lengkap, crew profesional, rasa yang bikin tamu rebutan antre.",
    ctaText: "Lihat Paket Stall",
    ctaLink: "/stall",
    ctaVariant: "primary",
    gradient: "from-primary/15 via-background to-background",
    accentGlow: "bg-primary/15",
  },
  {
    id: 3,
    badge: "Menu Delivery",
    badgeEmoji: "🍜",
    title: (
      <>
        Indomie <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9800] to-secondary">Premium</span> Antar ke Rumah
      </>
    ),
    subtitle: "Gratis ongkir radius 1km! Pilih mie + topping favorit, bayar online, KangDoMie langsung gaspol ke lokasimu.",
    ctaText: "Pesan Delivery",
    ctaLink: "/mienian-go#menu-go",
    ctaVariant: "secondary",
    gradient: "from-[#FF9800]/15 via-background to-background",
    accentGlow: "bg-[#FF9800]/10",
  },
];

export default function HeroBannerSlideshow() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Auto-advance
  useEffect(() => {
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next]);

  const slide = slides[current];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden min-h-[320px] sm:min-h-[340px]">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} transition-all duration-700`} />
          <div className={`absolute top-0 right-0 w-64 h-64 ${slide.accentGlow} rounded-full blur-[100px] transition-all duration-700`} />

          <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex items-center min-h-[320px] sm:min-h-[340px]">
            <div className="w-full max-w-2xl">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={slide.id}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-bold mb-5 text-foreground/70">
                    <span>{slide.badgeEmoji}</span>
                    <span>{slide.badge}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
                    {slide.title}
                  </h2>
                  <p className="text-foreground/50 text-sm sm:text-base mb-6 max-w-lg leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.ctaLink}
                    className={`btn ${slide.ctaVariant === "primary" ? "btn-primary" : "btn-secondary"} btn-md group`}
                  >
                    {slide.ctaText}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <div className="absolute bottom-6 right-6 flex items-center gap-3 z-20">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? "bg-foreground/60 w-6" : "bg-foreground/20 w-1.5"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
