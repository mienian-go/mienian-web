"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { formatRupiah } from "@/data/menu";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Loader2 } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function OrderSummary() {
  const { state, dispatch } = useBooking();
  const c = state.calculations;
  
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);

  const applyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setValidatingPromo(true);
    setPromoError("");
    dispatch({ type: "REMOVE_PROMO" });

    try {
      const q = query(collection(db, "promos"), where("code", "==", promoCodeInput.trim().toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setPromoError("Kode promo tidak valid atau tidak ditemukan.");
        setValidatingPromo(false);
        return;
      }

      const promo = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;

      if (!promo.isActive) {
        setPromoError("Kode promo ini sudah tidak aktif.");
      } else if (promo.service !== "stall" && promo.service !== "both") {
        setPromoError("Kode promo ini tidak berlaku untuk Catering (Stall).");
      } else if (promo.expiryDate && promo.expiryDate.seconds * 1000 < Date.now()) {
        setPromoError("Kode promo sudah kadaluarsa.");
      } else if (promo.maxUsage && promo.usageCount >= promo.maxUsage) {
        setPromoError("Kode promo sudah melewati batas kuota penggunaan.");
      } else if ((c.basePrice + c.extraPrice) < (promo.minPurchase || 0)) {
        setPromoError(`Minimal pembelian untuk promo ini adalah ${formatRupiah(promo.minPurchase)}`);
      } else {
        dispatch({ type: "APPLY_PROMO", payload: { promo } });
        setPromoCodeInput("");
      }
    } catch (err) {
      console.error(err);
      setPromoError("Terjadi kesalahan saat memvalidasi promo.");
    }
    setValidatingPromo(false);
  };
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

            {c.serviceFee > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex justify-between">
                <span className="text-foreground/70">Biaya Layanan</span>
                <span className="font-semibold">{formatRupiah(c.serviceFee)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PROMO SECTION */}
        <div className="pt-4 pb-2 border-t border-dashed border-card-border/50">
          {!state.appliedPromo ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="w-4 h-4 text-foreground/40" />
                  </div>
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="Kode promo?"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-sm font-semibold uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyPromoCode}
                  disabled={!promoCodeInput.trim() || validatingPromo}
                  className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-opacity"
                >
                  {validatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pakai"}
                </button>
              </div>
              {promoError && (
                <p className="text-primary text-[10px] font-medium">{promoError}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">{state.appliedPromo.code}</p>
                  <p className="text-[10px] text-foreground/60">Promo Berhasil Dipakai</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary">- {formatRupiah(c.promoDiscountAmount)}</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_PROMO" })}
                  className="text-foreground/40 hover:text-red-500 transition-colors"
                  title="Hapus Promo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
          )}
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
