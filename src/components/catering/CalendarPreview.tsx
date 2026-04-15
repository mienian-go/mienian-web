"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { useState } from "react";

const mockCities = ["Jakarta", "Bandung", "Yogyakarta"];

export function CalendarPreview() {
  const [activeCity, setActiveCity] = useState("Jakarta");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  // Mock slot data generator
  const getMockSlotStatus = (day: number) => {
    // Generate deterministic pseudo-random status based on day, month, city
    const seed = day + currentMonth * 30 + activeCity.length;
    if (seed % 7 === 0 || seed % 13 === 0) return "full"; // Red
    if (seed % 5 === 0 || seed % 4 === 0) return "warning"; // Yellow
    return "available"; // Green
  };

  return (
    <div className="w-full max-w-4xl mx-auto card p-6 sm:p-8 bg-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">

        {/* Left Info */}
        <div className="w-full md:w-1/3">
          <h3 className="text-2xl font-extrabold mb-2 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Booking Calendar Info
          </h3>
          <p className="text-foreground/60 text-sm mb-6">
            Jadwal Mienian Catering emang cepet banget sold out!.
          </p>

          <div className="space-y-2 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="font-semibold text-foreground/80">Shift Aman (Hijau)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="font-semibold text-foreground/80">Sisa Sedikit (Kuning)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="font-semibold text-foreground/80">Sold Out (Merah)</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-foreground/40 mb-2 uppercase tracking-wide flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Filter Kota Dapur
            </p>
            <div className="flex flex-wrap gap-2">
              {mockCities.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCity(c)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeCity === c ? "bg-primary text-white" : "bg-muted text-foreground/50 hover:bg-card-border"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Calendar */}
        <div className="flex-1 w-full bg-muted/50 rounded-2xl p-4 sm:p-6 border border-card-border">

          {/* Header Kalender */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-card-border rounded-lg text-foreground/60 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h4 className="font-bold text-lg w-48 text-center">{monthNames[currentMonth]} {currentYear}</h4>
            <button onClick={handleNextMonth} className="p-2 hover:bg-card-border rounded-lg text-foreground/60 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Grid Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, i) => (
              <div key={i} className="text-center text-xs font-bold text-foreground/40 py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 sm:h-12 rounded-lg opacity-0" />
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = getMockSlotStatus(day);
              const isPast = new Date(currentYear, currentMonth, day) < new Date(new Date().setHours(0, 0, 0, 0));

              let colorClass = "border-emerald-500/30 bg-emerald-500/10 text-emerald-600";
              if (status === "warning") colorClass = "border-amber-500/30 bg-amber-500/10 text-amber-600";
              if (status === "full" || isPast) colorClass = "border-rose-500/30 bg-rose-500/10 text-rose-500 opacity-50";

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className={`relative h-10 sm:h-12 flex items-center justify-center rounded-lg border text-sm font-bold ${colorClass}`}
                >
                  {day}
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
