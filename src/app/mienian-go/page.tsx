"use client";

import { motion } from "framer-motion";
import { MapPin, Sparkles, ShieldCheck, Clock, Utensils, ArrowRight } from "lucide-react";
import Link from "next/link";
import { menuItems, categoryLabels, categoryPrices, formatRupiah } from "@/data/menu";
import { PackageShowcase } from "@/components/PackageShowcase";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const mieItems = menuItems.filter((m) => m.category === "mie");

const scheduleData = [
  { day: "Senin - Rabu", area: "Jakarta Selatan — Kemang, Blok M, Tebet", time: "17:00 - 23:00" },
  { day: "Kamis - Jumat", area: "Jakarta Pusat — Sudirman, Menteng", time: "17:00 - 23:00" },
  { day: "Sabtu - Minggu", area: "Bandung — Dago, Braga, Pasteur", time: "15:00 - 23:00" },
];

export default function MienianGO() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ============ HERO ============ */}
      <section className="relative min-h-[60vh] flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-background to-background" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-secondary/10 rounded-full blur-[100px]" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-sm font-medium mb-6 text-secondary">
            <Sparkles className="w-4 h-4" />
            <span>Warmindo Keliling</span>
          </motion.div>

          <motion.h1 variants={item} className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-3xl">
            Gerobak <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#FFD54F]">Mienian</span> Siap Mangkal!
          </motion.h1>

          <motion.p variants={item} className="text-lg sm:text-xl text-foreground/60 max-w-2xl mb-8">
            Bukan warmindo biasa. Fresh cooking, menu variatif, dan antrean yang selalu rame — bukti rasa yang gak pernah bohong. 🛺
          </motion.p>

          <motion.div variants={item}>
            <a href="#lokasi" className="btn btn-secondary btn-lg">
              <MapPin className="w-5 h-5" />
              Cek Jadwal Mangkal
            </a>
          </motion.div>
        </motion.div>
      </section>

      <PackageShowcase />

      {/* ============ USP ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              Beda dari Warmindo <span className="gradient-text">Biasa</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">
              Tiga alasan kenapa antrean gerobak Mienian selalu panjang.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck className="w-8 h-8" />,
                title: "Standar Kebersihan Tinggi",
                desc: "Gerobak kita selalu bersih, peralatan steril, dan bahan baku fresh setiap hari. No compromise!",
                color: "tertiary",
              },
              {
                icon: <Utensils className="w-8 h-8" />,
                title: "Menu Super Variatif",
                desc: "10+ varian mie dan topping premium — dari Goreng Aceh sampai Beef Enoki. Bosen? Impossible.",
                color: "secondary",
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "Rasa Konsisten 24/7",
                desc: "SOP ketat biar rasa dari mangkok pertama sampai terakhir tetap sama mantapnya. Gak pake untung-untungan.",
                color: "primary",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card p-8 group text-center"
              >
                <div className={`w-16 h-16 rounded-2xl bg-${f.color}/10 text-${f.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-foreground/60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MENU HIGHLIGHTS ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              Menu <span className="gradient-text">Andalan</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">
              Semua varian mie cuma {formatRupiah(8500)} — topping mulai dari {formatRupiah(3500)}. Affordable tapi premium!
            </p>
          </motion.div>

          {/* Horizontal Scroll Carousel */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            {mieItems.map((mie, i) => (
              <motion.div
                key={mie.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="snap-center shrink-0 w-64"
              >
                <div className="card p-6 h-full">
                  <div className="w-full h-36 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
                    <span className="text-5xl">🍜</span>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{mie.name}</h4>
                  <p className="text-secondary font-bold text-lg">{formatRupiah(mie.price)}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Topping Quick List */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["topping-reguler", "topping-premium", "topping-super"] as const).map((cat) => (
              <div key={cat} className="card p-6">
                <h4 className="font-bold mb-2 flex items-center justify-between">
                  {categoryLabels[cat]}
                  <span className="text-primary text-sm">{formatRupiah(categoryPrices[cat])}</span>
                </h4>
                <ul className="space-y-1 text-sm text-foreground/60">
                  {menuItems.filter((m) => m.category === cat).map((m) => (
                    <li key={m.id}>• {m.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ LOKASI & JADWAL ============ */}
      <section id="lokasi" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              <MapPin className="w-8 h-8 inline-block mr-2 text-primary" />
              Jadwal <span className="gradient-text">Mangkal</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">
              Cek di mana gerobak Mienian lagi nongkrong minggu ini. Update setiap minggu!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {scheduleData.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 sm:p-8 text-center"
              >
                <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                  {s.day}
                </div>
                <h4 className="font-bold text-lg mb-2">{s.area}</h4>
                <p className="text-foreground/50 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  {s.time}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <p className="text-foreground/50 text-sm mb-4">
              📌 Jadwal bisa berubah sewaktu-waktu. Follow IG kita buat update real-time!
            </p>
            <a
              href="https://instagram.com/mienian_id"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outlined btn-md"
            >
              Follow @mienian_id
            </a>
          </motion.div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto card p-10 sm:p-14 text-center bg-gradient-to-br from-secondary/10 to-accent"
        >
          <h3 className="text-2xl sm:text-4xl font-extrabold mb-4">Mau Mienian di Acara Lo? 🔥</h3>
          <p className="text-foreground/60 text-lg max-w-lg mx-auto mb-8">
            Kalau nemu gerobak aja udah gini enaknya, bayangin live cooking buat acara lo gimana.
          </p>
          <Link href="/catering" className="btn btn-primary btn-lg">
            Cek Paket Catering
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
