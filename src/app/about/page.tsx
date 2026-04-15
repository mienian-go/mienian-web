"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Heart, Sparkles, ChefHat, Users, Award } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const team = [
  { name: "Founder", role: "The Visionary", emoji: "🧠", desc: "Yang punya ide gila bikin Warmindo jadi premium." },
  { name: "Head Chef", role: "The Flavor Master", emoji: "👨‍🍳", desc: "Orang di balik resep rahasia yang bikin ketagihan." },
  { name: "Event Lead", role: "The Hype Builder", emoji: "🎯", desc: "Yang mastiin setiap event berjalan mulus dan seru." },
  { name: "Operations", role: "The Machine", emoji: "⚙️", desc: "Logistik, supply chain, semuanya di-handle sama dia." },
  { name: "Creative", role: "The Storyteller", emoji: "🎨", desc: "Bikin brand Mienian selalu kelihatan kece dan relevan." },
  { name: "CS Team", role: "The Listeners", emoji: "💬", desc: "Fast response, ramah, dan selalu siap bantu lo." },
];

const timeline = [
  { year: "2021", title: "Gerobak Pertama", desc: "Dimulai dari satu gerobak kecil di pinggir jalan Jakarta Selatan. Modal nekat dan resep warisan." },
  { year: "2022", title: "Viral di TikTok", desc: "Video antrean panjang di gerobak Mienian viral. Demand meledak, tambah 3 gerobak baru." },
  { year: "2023", title: "Catering Pertama", desc: "Diundang live cooking di birthday party. Tamu pada nambah 3x. Mulai serius di catering." },
  { year: "2024", title: "4 Kota Coverage", desc: "Expand ke Bandung, Semarang, dan Yogyakarta. PT Mie Kekinian Sukses resmi berdiri." },
  { year: "2025", title: "500+ Events", desc: "Dari wedding sampai corporate. Mienian jadi go-to warmindo catering yang trusted." },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ============ HERO ============ */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute top-20 left-10 w-48 h-48 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-20 w-64 h-64 bg-secondary/10 rounded-full blur-[120px]" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium mb-6 text-primary">
            <Heart className="w-4 h-4" />
            <span>Our Story</span>
          </motion.div>

          <motion.h1 variants={item} className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[0.95]">
            Dari <span className="gradient-text">Gerobak</span> Sampai ke{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#FFD54F]">Wedding Party</span>
          </motion.h1>

          <motion.p variants={item} className="text-lg sm:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Cerita tentang gimana satu gerobak kecil di pinggir jalan bisa berubah jadi brand warmindo yang di-booking buat ratusan event. 🔥
          </motion.p>
        </motion.div>
      </section>

      {/* ============ TIMELINE ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              <Sparkles className="w-8 h-8 inline-block mr-2 text-secondary" />
              Journey <span className="gradient-text">Mienian</span>
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-tertiary md:-translate-x-1/2" />

            {timeline.map((t, i) => (
              <motion.div
                key={t.year}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex items-start gap-6 mb-12 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } flex-row`}
              >
                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background md:-translate-x-1/2 z-10 shrink-0" />

                {/* Content */}
                <div className={`ml-12 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-2">
                    {t.year}
                  </span>
                  <h3 className="text-xl font-bold mb-2">{t.title}</h3>
                  <p className="text-foreground/60 leading-relaxed">{t.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ THE CREW ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              <Users className="w-8 h-8 inline-block mr-2 text-primary" />
              The <span className="gradient-text">Crew</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">
              Tim passionate di balik setiap mangkok Mienian. Kecil tapi mighty! 💪
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-6 text-center group"
              >
                <div className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-300">
                  {member.emoji}
                </div>
                <h3 className="font-bold text-lg mb-0.5">{member.name}</h3>
                <p className="text-primary text-xs font-semibold mb-2">{member.role}</p>
                <p className="text-foreground/50 text-sm leading-relaxed">{member.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ OUR PROMISE ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              <Award className="w-8 h-8 inline-block mr-2 text-secondary" />
              Our <span className="gradient-text">Promise</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">
              Tiga komitmen yang gak pernah kita kompromiin.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck className="w-10 h-10" />,
                title: "Kebersihan #1",
                desc: "Standar higienitas ketat dari bahan baku sampai penyajian. Peralatan selalu steril, kru selalu pakai APD. Gak pake kompromi.",
                color: "tertiary",
              },
              {
                icon: <ChefHat className="w-10 h-10" />,
                title: "Rasa Konsisten",
                desc: "SOP memasak yang terstandarisasi. Dari mangkok pertama sampai mangkok ke-300, rasanya tetap sama mantapnya. Guaranteed.",
                color: "primary",
              },
              {
                icon: <Heart className="w-10 h-10" />,
                title: "Experience Premium",
                desc: "Bukan cuma jualan makanan — kita jualan experience. Setup rapih, kru fun & professional, dan tamu lo pasti ketagihan.",
                color: "secondary",
              },
            ].map((promise, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card p-8 sm:p-10 text-center group"
              >
                <div className={`w-20 h-20 rounded-2xl bg-${promise.color}/10 text-${promise.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-${promise.color} group-hover:text-white transition-all duration-300`}>
                  {promise.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{promise.title}</h3>
                <p className="text-foreground/60 leading-relaxed">{promise.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
