"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, PartyPopper, CheckCircle2, ArrowRight } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import { formatRupiah } from "@/data/menu";

export default function WeddingInfoPage() {
  const { state } = useBooking();
  const weddingPackages = state.packages.filter(p => p.category === "wedding" && p.isActive && !p.comingSoon);

  return (
    <div className="min-h-screen bg-background pb-24 pt-32 relative">
      <div className="max-w-4xl mx-auto px-4">

        <Link href="/stall" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors mb-8 self-start">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Mienian Stall</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 flex items-center gap-3">
            <PartyPopper className="w-8 h-8 text-secondary" /> Paket Wedding
          </h1>
          <p className="text-foreground/60 mb-10 text-sm max-w-xl">
            Pindahin Warmindo ke acara pernikahan kamu! Pilih salah satu paket wedding di bawah ini, 
            lalu klik tombol pesan untuk lanjut ke formulir booking.
          </p>
        </motion.div>

        {/* T&C */}
        <div className="bg-secondary/10 border border-secondary/30 p-5 sm:p-6 rounded-2xl mb-10">
          <h2 className="font-bold text-secondary mb-3">Ketentuan Pemesanan Paket Wedding</h2>
          <ul className="text-sm space-y-2 text-foreground/80 list-disc pl-4">
            <li>Pilih salah satu Paket yang ada.</li>
            <li>Jumlah porsi bisa ditambah, namun tidak bisa dikurangi.</li>
            <li>Setiap paket sudah termasuk sawi & topping sesuai deskripsi.</li>
            <li>Penambahan porsi dihitung sesuai harga <b>satuan paket</b>.</li>
            <li>Bisa pilih menggunakan <b>Stall Gerobak atau portable</b> (sudah termasuk).</li>
            <li>Outdoor menggunakan kompor gas tabung gas 3kg/5kg.</li>
            <li>Butuh listrik 350 watt untuk water boiler (jika ada pilihan mie kuah).</li>
            <li>Indoor bisa menggunakan Kompor Gas atau Kompor Listrik</li>
            <li>Tim tiba di lokasi H-3 jam sebelum serving untuk preparation</li>
            <li>Sudah termasuk <b>2 Orang Petugas</b> untuk full payment.</li>
            <li>Booking/Lock tanggal hanya berlaku setelah melakukan pembayaran</li>
            <li>Maksimum serving 3 jam</li>
            <li>Pesanan yang sudah dibayar tidak bisa cancel atau refund</li>
          </ul>
        </div>

        {/* Package Cards */}
        <h2 className="text-xl font-bold mb-6">Pilih Paket Wedding</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {weddingPackages.map((pkg, idx) => {
            const imgSrc = pkg.image || `/images/paket-wedding-${(idx % 6) + 1}.jpg`;
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden">
                  <img src={imgSrc} alt={pkg.name} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-sm mb-1">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1.5 mb-4">
                    <span className="text-lg font-extrabold text-secondary">{formatRupiah(pkg.price)}</span>
                    <span className="text-[10px] text-foreground/50">/ {pkg.portions} porsi</span>
                  </div>
                  {pkg.description && (
                    <p className="text-xs text-foreground/60 mb-4 line-clamp-2">{pkg.description}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Link
            href="/stall/booking?category=wedding"
            className="btn btn-primary btn-lg inline-flex items-center gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all text-lg px-10 py-4"
          >
            Pesan Paket Wedding Sekarang
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
