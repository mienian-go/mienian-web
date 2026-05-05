"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Utensils, CreditCard, CheckCircle, Flame, PartyPopper, Users } from "lucide-react";
import { CalendarPreview } from "@/components/catering/CalendarPreview";


const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const cities = [
  { name: "Jakarta", emoji: "🏙️", desc: "Selatan, Pusat, Barat" },
  { name: "Bandung", emoji: "🌄", desc: "Dago, Braga, Setiabudi" },
  { name: "Semarang", emoji: "🏛️", desc: "Coming Soon!" },
  { name: "Yogyakarta", emoji: "🏯", desc: "Malioboro, Sleman" },
];

const steps = [
  { icon: <Utensils className="w-6 h-6" />, title: "Pilih Paket", desc: "Browse menu dan paket catering yang cocok buat acara lo." },
  { icon: <CreditCard className="w-6 h-6" />, title: "Isi Detail & Bayar", desc: "Lengkapi form event dan selesaikan pembayaran. Sat-set!" },
  { icon: <CheckCircle className="w-6 h-6" />, title: "Kru Take Over!", desc: "Tim Mienian dateng, setup, dan live cooking di venue lo. 🔥" },
];

export default function CateringLanding() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ============ HERO ============ */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        {/* Background Image using inline style to guarantee load */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/bg-hero-banner-catering1.png')" }}
        />
        <div className="absolute inset-0 bg-black/45" />

        {/* Glow Effects */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-secondary/20 rounded-full blur-[80px]" />

        <motion.div variants={container} initial="hidden" animate="show" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 text-white backdrop-blur-md">
            <Flame className="w-4 h-4 text-secondary" />
            <span>Warmindo Live Cooking Catering Pertama</span>
          </motion.div>

          <motion.h1 variants={item} className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-[0.95]">
            Sajian{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#FFD54F]">Anti-mainstream</span>
          </motion.h1>

          <motion.p variants={item} className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-4">
            Wangi Bumbunya Menggoda, Dimasak Dadakan dan Disajikan Hangat untuk Setiap Momen Spesialmu!
          </motion.p>

          <motion.p variants={item} className="text-sm text-white/60 max-w-lg mx-auto mb-10">
            🗺️ Kita ready buat take over acara kalian di <br className="hidden sm:inline" />
            <strong className="text-white">JaBoDeTaBek, Bandung,</strong> dan <strong className="text-white">Yogyakarta.</strong>
          </motion.p>

          <motion.div variants={item}>
            <Link href="/catering/booking" className="btn btn-secondary btn-lg shadow-xl hover:-translate-y-1 transition-all">
              Booking Sekarang
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>



      {/* ============ KATEGORI QUICK LINKS ============ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background relative z-20 -mt-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            href="/menu/reguler"
            className="flex-1 w-full bg-white dark:bg-card border-b-4 border-primary rounded-2xl p-6 shadow-xl hover:-translate-y-2 transition-transform duration-300 text-center flex flex-col items-center justify-center group"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-1">Pesan Reguler</h3>
            <p className="text-sm text-foreground/60">buat yang mau pilih sesuai selera</p>
          </Link>

          <Link
            href="/menu/wedding"
            className="flex-1 w-full bg-white dark:bg-card border-b-4 border-secondary rounded-2xl p-6 shadow-xl hover:-translate-y-2 transition-transform duration-300 text-center flex flex-col items-center justify-center group"
          >
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <PartyPopper className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-1">Paket Wedding</h3>
            <p className="text-sm text-foreground/60">simple dan cepat</p>
          </Link>

          <Link
            href="/menu/gathering"
            className="flex-1 w-full bg-white dark:bg-card border-b-4 border-accent rounded-2xl p-6 shadow-xl hover:-translate-y-2 transition-transform duration-300 text-center flex flex-col items-center justify-center group"
          >
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-1">Paket Gathering</h3>
            <p className="text-sm text-foreground/60">cocok buat acara selebrasi</p>
          </Link>
        </div>
      </section>

      {/* ============ CALENDAR AVAILABILITY ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-20 -mt-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <CalendarPreview />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
          <Link href="/catering/booking" className="btn btn-primary btn-lg shadow-xl hover:-translate-y-0.5 transition-all text-lg px-8 py-4">
            Booking Sekarang
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* ============ COVERAGE AREA ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              <MapPin className="w-8 h-8 inline-block mr-2 text-primary" />
              Area <span className="gradient-text">Coverage</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">
              Mienian siap mindahin Warmindo untuk live cooking catering ke acara-acara di kota kamu.

            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {cities.map((city, i) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 sm:p-8 text-center group hover:border-primary/30"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{city.emoji}</div>
                <h3 className="text-xl font-bold mb-1">{city.name}</h3>
                <p className="text-foreground/50 text-sm">{city.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              Gampang Banget, <span className="gradient-text">3 Langkah</span> Aja
            </h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">
              Dari pilih paket sampai kru dateng — prosesnya sat-set, anti ribet.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                {/* Step Number */}
                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center">
                      {step.icon}
                    </div>
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-foreground/60 leading-relaxed">{step.desc}</p>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-dark-maroon via-[#6B1010] to-dark-maroon p-12 sm:p-16 text-center text-white overflow-hidden relative"
        >
          <div className="absolute top-0 left-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10">
            <h3 className="text-2xl sm:text-4xl font-extrabold mb-4">
              Slot Terbatas, Siapa cepat dia dapat! ⏰
            </h3>
            <p className="text-white/60 text-lg max-w-lg mx-auto mb-8">
              Jangan sampai slot habis diambil orang
            </p>
            <Link href="/catering/booking" className="btn btn-secondary btn-lg">
              Booking sekarang
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
