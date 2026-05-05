"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  Rocket, 
  Target, 
  Award,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function AffiliateLandingPage() {
  const benefits = [
    {
      title: "Komisi 5% Setiap Order",
      desc: "Dapatkan persentase tetap dari setiap total pesanan katering yang berhasil diverifikasi.",
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      title: "Dashboard Real-Time",
      desc: "Pantau jumlah klik, pesanan masuk, dan total komisi Anda secara transparan.",
      icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Pencairan Mudah",
      desc: "Komisi akan dikirimkan setiap bulan langsung ke rekening Anda tanpa ribet.",
      icon: Award,
      color: "text-primary",
      bg: "bg-primary/10"
    }
  ];

  const steps = [
    { title: "Daftar", desc: "Isi formulir pendaftaran dan tentukan kode affiliate unik Anda.", icon: Target },
    { title: "Bagikan", desc: "Sebarkan link affiliate Anda ke penyelenggara acara, WO, atau komunitas.", icon: Rocket },
    { title: "Cuan", desc: "Dapatkan komisi untuk setiap pesanan yang lunas melalui link Anda.", icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 blur-3xl -z-10" />
        
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 border border-primary/20"
          >
            <Users className="w-3.5 h-3.5" /> Mienian Partnership Program
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6"
          >
            Promosikan Mienian,<br />
            <span className="text-primary italic">Dapatkan Penghasilan</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Bergabunglah dengan program kemitraan kami dan dapatkan komisi menarik untuk setiap referensi pesanan katering Mienian yang sukses.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/affiliate/register" 
              className="group relative w-full sm:w-auto px-8 py-4 bg-primary text-white font-extrabold rounded-2xl overflow-hidden shadow-xl shadow-primary/30 transition-all hover:scale-105"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center gap-2 uppercase tracking-wider">
                Daftar Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link 
              href="/affiliate/dashboard" 
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-foreground font-bold rounded-2xl hover:bg-white/10 transition-all"
            >
              Login Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 border-y border-white/5 bg-card/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-card border border-white/5 shadow-xl hover:border-primary/30 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${benefit.bg} ${benefit.color} group-hover:scale-110 transition-transform`}>
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-foreground/50 text-sm leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Cara Kerjanya</h2>
            <p className="text-foreground/50">Hanya perlu 3 langkah mudah untuk mulai cuan bersama Mienian.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -z-10" />
            
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-background border-4 border-white/5 flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10 group-hover:border-primary transition-all">
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white text-sm font-black flex items-center justify-center">
                    {i + 1}
                  </div>
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                <p className="text-sm text-foreground/50 max-w-[200px] mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-32">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[2.5rem] bg-primary p-12 overflow-hidden text-center text-white"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern.svg')] opacity-10" />
            <h2 className="text-4xl font-black mb-6 relative z-10 italic">Siap Tumbuh Bersama Mienian?</h2>
            <p className="text-white/80 mb-10 text-lg relative z-10">Daftarkan diri Anda sekarang dan jadilah bagian dari revolusi katering modern.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link 
                href="/affiliate/register" 
                className="w-full sm:w-auto px-10 py-5 bg-white text-primary font-black rounded-2xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-2xl"
              >
                DAFTAR SEKARANG <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
