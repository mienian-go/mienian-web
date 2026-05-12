"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, Clock, Gift } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: string;
  emoji: string;
  expiresIn: string;
}

const QUESTS: Quest[] = [
  {
    id: "1",
    title: "Mie Siang Hemat!",
    description: "Pesen mie jam 11:00 - 14:00",
    reward: "Ekstra Topping GRATIS",
    emoji: "🍳",
    expiresIn: "Hari ini",
  },
  {
    id: "2",
    title: "Double Power!",
    description: "Beli 2 porsi mie sekaligus",
    reward: "+200 Poin Bonus",
    emoji: "⚡",
    expiresIn: "Hari ini",
  },
  {
    id: "3",
    title: "Topping Hunter",
    description: "Cobain 3 topping berbeda",
    reward: "Diskon 15% Next Order",
    emoji: "🎯",
    expiresIn: "Minggu ini",
  },
];

export default function DailyQuestWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuest, setCurrentQuest] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Auto-rotate quests
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentQuest((prev) => (prev + 1) % QUESTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Show after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 right-4 z-40 w-[280px]"
        >
          <div className="card p-0 overflow-hidden border-secondary/30 shadow-2xl shadow-secondary/10">
            {/* Header */}
            <div className="bg-gradient-to-r from-secondary to-[#FFD54F] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-white" />
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">Daily Quest</span>
              </div>
              <button 
                onClick={() => setDismissed(true)}
                className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>

            {/* Quest Content */}
            <div className="p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={QUESTS[currentQuest].id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{QUESTS[currentQuest].emoji}</span>
                    <div>
                      <h4 className="font-bold text-sm">{QUESTS[currentQuest].title}</h4>
                      <p className="text-[11px] text-foreground/50">{QUESTS[currentQuest].description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary">
                      <Gift className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{QUESTS[currentQuest].reward}</span>
                    </div>
                    <div className="flex items-center gap-1 text-foreground/30">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px]">{QUESTS[currentQuest].expiresIn}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Dots indicator */}
              <div className="flex justify-center gap-1.5 mt-3">
                {QUESTS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuest(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === currentQuest ? "bg-secondary w-4" : "bg-foreground/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
