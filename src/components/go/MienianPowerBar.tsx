"use client";

import { motion } from "framer-motion";
import { Zap, Gift, TrendingUp } from "lucide-react";

interface MienianPowerBarProps {
  points: number;
  level: number;
  userName?: string;
}

const LEVEL_THRESHOLDS = [0, 500, 2000, 5000, 10000, 25000];
const LEVEL_NAMES = ["Newbie", "Reguler", "Mania", "Sultan", "Legend", "God Tier"];
const LEVEL_COLORS = ["#9E9E9E", "#4CAF50", "#FF9800", "#E91E63", "#9C27B0", "#FFD700"];

export default function MienianPowerBar({ points = 0, level = 0, userName }: MienianPowerBarProps) {
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = Math.min(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100);
  const levelName = LEVEL_NAMES[level] || "Newbie";
  const levelColor = LEVEL_COLORS[level] || "#9E9E9E";

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

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold transition-colors">
          <Gift className="w-3.5 h-3.5" />
          Tuker Poin
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors">
          <TrendingUp className="w-3.5 h-3.5" />
          Riwayat
        </button>
      </div>
    </motion.div>
  );
}
