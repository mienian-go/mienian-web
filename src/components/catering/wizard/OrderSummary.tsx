"use client";

import { useBooking } from "@/context/BookingContext";
import { formatRupiah } from "@/data/menu";
import { motion, AnimatePresence } from "framer-motion";

export function OrderSummary() {
  const { state } = useBooking();
  const c = state.calculations;
  
  return (
    <div className="card p-6 sticky top-24 bg-card shadow-sm border border-card-border/50">
      <h3 className="font-extrabold text-lg mb-4 text-primary uppercase tracking-wider">Ringkasan Pesanan</h3>

      <div className="space-y-4 text-sm">
        {/* Acara & Profil */}
        {state.name && (
          <div className="flex flex-col gap-1 pb-3 border-b border-card-border/30">
            <span className="text-foreground/50 text-xs">Customer</span>
            <span className="font-semibold">{state.name} — {state.whatsapp || "-"}</span>
            {state.eventType &&  <span className="text-xs font-medium text-tertiary">{state.eventType}</span>}
          </div>
        )}

        {/* Lokasi & Tanggal */}
        {state.city && (
          <div className="flex flex-col gap-1 pb-3 border-b border-card-border/30">
            <span className="text-foreground/50 text-xs">Lokasi & Acara</span>
            <span className="font-semibold">{state.city}</span>
            <span className="text-xs text-foreground/70 line-clamp-2">{state.address || "-"}</span>
            {state.distanceKm > 0 && <span className="text-xs text-foreground/50">Est. Jarak: {state.distanceKm.toFixed(1)} km</span>}
            {state.date && (
              <span className="text-xs font-medium mt-1">
                {new Date(state.date).toLocaleDateString("id-ID", { dateStyle: "long" })} · {state.time || "-"}
              </span>
            )}
          </div>
        )}

        {/* Breakdown Harga */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between">
            <span className="text-foreground/70">Harga Paket Dasar</span>
            <span className="font-semibold">{formatRupiah(c.basePrice)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-foreground/70">Ekstra Porsi Menu</span>
            <span className="font-semibold">{formatRupiah(c.extraPrice)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-foreground/70">
              Biaya Petugas {c.staffCount > 0 && <span className="text-xs opacity-50">({c.staffCount} org)</span>}
            </span>
            <span className="font-semibold">{c.staffFee === 0 && !state.packageId ? "Rp 0" : c.staffFee === 0 ? "GRATIS" : formatRupiah(c.staffFee)}</span>
          </div>

          <AnimatePresence>
            {c.extraFee > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex justify-between">
                <span className="text-foreground/70">Biaya Tambahan (Stall)</span>
                <span className="font-semibold">{formatRupiah(c.extraFee)}</span>
              </motion.div>
            )}

            {c.transportFee > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex justify-between text-accent">
                <span className="">Biaya Transport (PP)</span>
                <span className="font-semibold">{formatRupiah(c.transportFee)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Grand Total */}
        <div className="pt-4 mt-2 border-t-2 border-dashed border-card-border">
          <div className="flex justify-between items-end mb-1">
            <span className="font-semibold text-lg text-foreground">Total Keseluruhan</span>
            <span className="font-extrabold text-2xl text-primary">{formatRupiah(c.grandTotal)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-foreground/60 font-medium tracking-wide">TOTAL PORSI</span>
            <span className="font-bold py-1 px-2 rounded bg-tertiary/10 text-tertiary">
              {c.totalPorsi} Pax
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
