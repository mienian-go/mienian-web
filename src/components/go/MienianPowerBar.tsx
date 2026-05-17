"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gift, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUserPoints, initUserPoints, type UserPoints } from "@/lib/firestoreGo";
import Link from "next/link";

const LEVEL_THRESHOLDS = [0, 500, 2000, 5000, 10000, 25000];
const LEVEL_NAMES = ["Newbie", "Reguler", "Mania", "Sultan", "Legend", "God Tier"];
const LEVEL_COLORS = ["#9E9E9E", "#4CAF50", "#FF9800", "#E91E63", "#9C27B0", "#FFD700"];

export default function MienianPowerBar() {
  const { user } = useAuth();
  const [data, setData] = useState<UserPoints | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!user) {
      setData(null);
      return;
    }

    // Initialize points doc if doesn't exist
    initUserPoints(user.uid, user.displayName || "User").catch(console.error);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserPoints(user.uid, (pointsData) => {
      setData(pointsData);
    });

    return () => unsubscribe();
  }, [user]);

  const points = data?.points || 0;
  const level = data?.level || 0;
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = Math.min(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100);
  const levelName = LEVEL_NAMES[level] || "Newbie";
  const levelColor = LEVEL_COLORS[level] || "#9E9E9E";

  if (!user) {
    // Guest mode — show teaser
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-5 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Mienian Power</p>
            <p className="text-sm font-bold text-foreground/60">Login untuk mulai kumpulin poin!</p>
          </div>
        </div>
        <p className="text-xs text-foreground/40">Setiap Rp 1.000 belanja = 100 poin. Tuker poin jadi diskon! 🔥</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Mienian Power</p>
            <p className="text-xl font-extrabold leading-tight">{points.toLocaleString("id-ID")} <span className="text-sm text-foreground/50 font-medium">poin</span></p>
          </div>
        </div>
        <div className="text-right">
          <span 
            className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
            style={{ backgroundColor: `${levelColor}20`, color: levelColor }}
          >
            {levelName}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${levelColor}, ${LEVEL_COLORS[Math.min(level + 1, LEVEL_COLORS.length - 1)]})` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <p className="text-[10px] text-foreground/40">{points.toLocaleString("id-ID")} poin</p>
          <p className="text-[10px] text-foreground/40">{nextThreshold.toLocaleString("id-ID")} poin</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 text-[10px] text-foreground/40 mb-3">
        <span>📊 Total belanja: {(data?.totalSpent || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}</span>
        <span>•</span>
        <span>{data?.totalOrders || 0} pesanan</span>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button 
          onClick={() => setShowQR(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          QR Member
        </button>
        <Link href="/dashboard" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors">
          <TrendingUp className="w-3.5 h-3.5" />
          Riwayat
        </Link>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowQR(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-card p-6 rounded-3xl shadow-xl border border-border text-center"
            >
              <h3 className="text-xl font-bold mb-2">QR E-Card Mienian</h3>
              <p className="text-xs text-foreground/60 mb-6">Tunjukkan QR ini ke KangDoMie saat beli langsung di gerobak untuk dapetin poin!</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block shadow-sm mb-6">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${user.uid}`}
                  alt="QR Code Member"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="bg-secondary/10 text-secondary px-4 py-2 rounded-xl text-xs font-bold mb-6">
                {levelName} Member • {points.toLocaleString("id-ID")} poin
              </div>

              <button 
                onClick={() => setShowQR(false)}
                className="w-full py-3 rounded-xl bg-muted hover:bg-muted/80 text-sm font-bold transition-colors"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
