"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, UtensilsCrossed } from "lucide-react";

export default function RegulerInfoPage() {
  return (
    <div className="min-h-screen bg-background pb-24 pt-32 relative">
      <div className="max-w-3xl mx-auto px-4">

        <Link href="/stall" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors mb-8 self-start">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Mienian Stall</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-primary" /> Paket Reguler (A la carte)
          </h1>
          <p className="text-foreground/60 mb-10 text-sm max-w-xl">
            Cocok untuk acara gathering, khitanan, pengajian, atau syukuran. 
            Bebas pilih varian mie dan topping sesuka hati, minimum order Rp 700.000.
          </p>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
            <h3 className="font-bold mb-2 text-primary">🍜 Mie</h3>
            <p className="text-sm text-foreground/70">10 varian Indomie. Pilih hingga 3 varian berbeda. Rp 10.000/porsi.</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
            <h3 className="font-bold mb-2 text-primary">🥟 Topping Reguler</h3>
            <p className="text-sm text-foreground/70">Dumpling, Baso Sapi/Ikan/Salmon, dll. Rp 5.000/pc.</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
            <h3 className="font-bold mb-2 text-primary">⭐ Topping Premium</h3>
            <p className="text-sm text-foreground/70">Odeng, Telur Ceplok. Rp 8.000/pc.</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
            <h3 className="font-bold mb-2 text-primary">🔥 Topping Super</h3>
            <p className="text-sm text-foreground/70">Slice Beef, Grill Chicken, Beef Enoki, Katsu, Kornet. Rp 13.000/pc.</p>
          </div>
        </div>

        {/* T&C */}
        <div className="bg-primary/5 border border-primary/20 p-5 sm:p-6 rounded-2xl mb-10">
          <h2 className="font-bold text-primary mb-3">Ketentuan Paket Reguler</h2>
          <ul className="text-sm space-y-2 text-foreground/80 list-disc pl-4">
            <li>Minimum order Rp 700.000 (tidak termasuk transport & peralatan).</li>
            <li>Sudah termasuk 1 petugas. Tambahan petugas Rp 75.000/orang.</li>
            <li>Pilihan stall: Booth portable (gratis) atau Gerobak (+Rp 250.000).</li>
            <li>Butuh listrik 350 watt untuk water boiler (jika ada pilihan mie kuah).</li>
            <li>Tim tiba di lokasi H-3 jam sebelum serving untuk preparation.</li>
            <li>Maksimum serving 3 jam.</li>
          </ul>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <Link
            href="/stall/booking"
            className="btn btn-primary btn-lg inline-flex items-center gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all text-lg px-10 py-4"
          >
            Pesan Paket Reguler Sekarang
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-xs text-foreground/50">
            Anda akan diarahkan ke formulir booking step-by-step
          </p>
        </motion.div>

      </div>
    </div>
  );
}
