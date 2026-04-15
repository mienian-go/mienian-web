"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Clock } from "lucide-react";

export default function PaketGathering() {
  return (
    <div className="min-h-screen bg-background flex flex-col pt-24 pb-24 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 w-full flex-1 flex flex-col relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors mb-12 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center space-y-8 mt-12"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full scale-150 animate-pulse" />
            <div className="w-24 h-24 bg-gradient-to-br from-accent to-accent/50 rounded-3xl flex items-center justify-center relative shadow-xl shadow-accent/20">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
              Paket <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#7E57C2]">Gathering</span>
            </h1>
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-muted rounded-full border border-border">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold tracking-wider uppercase text-foreground/80">Coming Soon</span>
            </div>
          </div>

          <p className="text-lg text-foreground/60 max-w-lg leading-relaxed">
            Tenang, kita lagi nyiapin paket spesial buat nemenin acara gathering kantor, reuni, atau nongkrong gede lo. Pantengin terus ya! 🚀
          </p>

          <div className="pt-8 w-full max-w-sm">
            <Link href="/" className="btn btn-outlined w-full justify-center">
              Lihat Menu Lainnya Dulu
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
