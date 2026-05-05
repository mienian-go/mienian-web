"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Truck,
  PartyPopper,
  Flame,
  Users,
  Star,
  ChefHat,
} from "lucide-react";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { PackageShowcase } from "@/components/PackageShowcase";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function Home() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ============ HERO SECTION ============ */}
      <section className="relative min-h-[110vh] sm:min-h-screen flex items-center justify-center pt-32 pb-24 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src="/images/bg-hero-banner-catering.gif" alt="Mienian Catering" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-maroon/80 via-dark-maroon/60 to-dark-maroon/90" />
        </div>
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />

        {/* Floating Decorations */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-secondary/20 rounded-full blur-[80px] animate-float" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-primary/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-secondary/10 rounded-full blur-[60px] animate-float" style={{ animationDelay: "2s" }} />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white"
        >
          {/* Badge */}
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-8 backdrop-blur-sm"
          >
            <Flame className="w-4 h-4 text-secondary" />
            <span>Warmindo Live Cooking Experience at your Door</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight mb-6 leading-[0.95]"
          >
            Kita{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#FFD54F]">
              Samperin
            </span>
            ,
            <br />
            Masakin, {" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#FF6B6B]">
              Kenyangin
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={item}
            className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Dari gerobak keliling yang nongkrong di sudut kota, sampai live cooking di wedding, private party & corporate gathering. Mienian selalu siap take over! Event Kamu
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/catering"
              className="btn btn-primary btn-lg group"
            >
              Pesen Catering
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/mienian-go"
              className="btn btn-outlined btn-lg border-white/30 text-white hover:border-secondary hover:text-secondary hover:bg-white/5"
            >
              <Truck className="w-5 h-5" />
              Cari Gerobak
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={item}
            className="mt-16 pb-16 grid grid-cols-3 gap-4 max-w-xl mx-auto"
          >
            {[
              { num: "500+", label: "Event Served" },
              { num: "50K+", label: "Porsi Tersaji" },
              { num: "3", label: "Kota Coverage" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-secondary">{stat.num}</p>
                <p className="text-xs sm:text-sm text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-5 h-8 border-2 border-white/20 rounded-full flex items-start justify-center p-1"
          >
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      <PackageShowcase />

      {/* ============ SPLIT SECTION: Pilih Jalur Lo ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              Pilih <span className="gradient-text">Jalur Lo</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">
              Mau jajan langsung di gerobak atau booking catering buat acara? Semua ada di sini.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mienian GO Card */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/mienian-go" className="block group">
                <div className="relative h-[440px] rounded-3xl overflow-hidden card border-2 border-transparent hover:border-secondary/40">
                  {/* Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-accent to-background" />
                  <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px]" />

                  <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Truck className="w-8 h-8 text-secondary" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">Mienian GO</h3>
                      <p className="text-foreground/60 text-lg leading-relaxed">
                        Lagi BM Indomie? Cari gerobak kita yang lagi keliling di deket lo. Fresh, panas, langsung masak di depan mata! 🛺
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-secondary font-semibold group-hover:gap-4 transition-all">
                      <span>Cari Gerobak Sekarang</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Mienian Catering Card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/catering" className="block group">
                <div className="relative h-[440px] rounded-3xl overflow-hidden card border-2 border-transparent hover:border-primary/40">
                  {/* Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent to-background" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px]" />

                  <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <PartyPopper className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">Mienian Catering</h3>
                      <p className="text-foreground/60 text-lg leading-relaxed">
                        Bikin acara lo makin pecah pakai live cooking katering kita. Wedding, birthday, corporate — kita handle semua! 🎉
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
                      <span>Lihat Paket Catering</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ WHY MIENIAN ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              Kenapa Harus <span className="gradient-text">Mienian</span>?
            </h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">
              Bukan cuma Indomie biasa — ini experience yang beda level.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <ChefHat className="w-7 h-7" />,
                title: "Live Cooking",
                desc: "Masak fresh di depan mata, bukan reheated atau basi. Kamu bisa request level pedes juga!",
              },
              {
                icon: <Star className="w-7 h-7" />,
                title: "Menu Variatif",
                desc: "10+ varian mie dan topping premium. Dari Goreng Aceh sampai Chicken Katsu, semua ada.",
              },
              {
                icon: <Users className="w-7 h-7" />,
                title: "Tim Profesional",
                desc: "Kru yang udah handle ratusan event. Bersih, rapih, dan fun — bikin tamu lo betah.",
              },
              {
                icon: <MapPin className="w-7 h-7" />,
                title: "3 Kota Coverage",
                desc: "Jakarta, Bandung, dan Yogyakarta. Expanding terus buat lo!",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 sm:p-8 text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SOCIAL PROOF ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              Real <span className="gradient-text">Vibes</span> dari Customer
            </h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">
              Bukan kita yang ngomong — ini kata mereka yang udah nyobain Mienian.
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                name: "Sarah A.",
                role: "Wedding Planner",
                text: "Baru kali ini nemuin catering yang bikin tamu undangan REBUTAN antre. Mienian emang beda sih!",
                rating: 5,
              },
              {
                name: "Rizky H.",
                role: "Corporate Event Organizer",
                text: "Setup-nya rapih, krunya fun banget, dan mie-nya? Rasanya konsisten dari mangkok pertama sampai mangkok ke-200.",
                rating: 5,
              },
              {
                name: "Dinda M.",
                role: "Birthday Party Host",
                text: "Gue kira cuma Indomie biasa, ternyata level-nya beda parah. Topping Chicken Katsu-nya TOP!",
                rating: 5,
              },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-8"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-foreground/80 mb-6 leading-relaxed italic">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{review.name}</p>
                    <p className="text-foreground/50 text-xs">{review.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <a
              href="https://instagram.com/mienian_id"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outlined btn-md inline-flex"
            >
              <InstagramIcon className="w-5 h-5" />
              Follow @mienian_id
            </a>
          </motion.div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#A00D24] to-dark-maroon p-12 sm:p-16 text-center text-white"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              Ready Bikin Acara Lo Makin Hype? 🔥
            </h2>
            <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
              First pay, first serve. Booking slot tanggal lo sekarang sebelum keambil orang lain!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/catering/menu"
                className="btn btn-secondary btn-lg"
              >
                Lihat Paket & Pesen Sekarang
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://wa.me/6285216706922"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outlined btn-md border-white/30 text-white hover:border-white hover:bg-white/10"
              >
                Chat Admin WA
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
