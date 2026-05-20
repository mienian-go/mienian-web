"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, Clock, Gift } from "lucide-react";
import { getActiveDailyQuests, type DailyQuest } from "@/lib/firestoreGo";

const FALLBACK_QUESTS = [
  {
    id: "fallback-1",
    title: "Mie Siang Hemat!",
    description: "Pesen mie jam 11:00 - 14:00",
    reward: "Ekstra Topping GRATIS",
    emoji: "🍜",
    isActive: true,
    expiresAt: null,
    createdAt: null,
  },
  {
    id: "fallback-2",
    title: "Double Power!",
    description: "Beli 2 porsi mie sekaligus",
    reward: "+200 Poin Bonus",
    emoji: "⚡",
    isActive: true,
    expiresAt: null,
    createdAt: null,
  },
  {
    id: "fallback-3",
    title: "Topping Hunter",
    description: "Cobain 3 topping berbeda",
    reward: "Diskon 15% Next Order",
    emoji: "🎯",
    isActive: true,
    expiresAt: null,
    createdAt: null,
  },
];

export default function DailyQuestWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuest, setCurrentQuest] = useState(1); // Set to index 1 ("Double Power!") as active initial like screenshot
  const [dismissed, setDismissed] = useState(false);
  const [quests, setQuests] = useState<DailyQuest[]>([]);

  // Fetch quests from Firestore
  useEffect(() => {
    async function fetchQuests() {
      try {
        const data = await getActiveDailyQuests();
        setQuests(data.length > 0 ? data : FALLBACK_QUESTS);
      } catch (err) {
        console.error("Error fetching quests:", err);
        setQuests(FALLBACK_QUESTS);
      }
    }
    fetchQuests();
  }, []);

  // Auto-rotate quests
  useEffect(() => {
    if (!isOpen || quests.length === 0) return;
    const interval = setInterval(() => {
      setCurrentQuest((prev) => (prev + 1) % quests.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, quests.length]);

  // Show after 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed || quests.length === 0) return null;

  const quest = quests[currentQuest];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 30, scale: 0.95, x: "-50%" }}
          className="fixed bottom-[92px] left-1/2 z-45 w-[calc(100%-32px)] max-w-[340px]"
        >
          <div className="card p-0 overflow-hidden border border-[#FFB300]/20 shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl">
            {/* Header */}
            <div className="bg-[#FFB300] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-white fill-white animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  DAILY QUEST
                </span>
              </div>
              <button 
                onClick={() => setDismissed(true)}
                className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>

            {/* Quest Content */}
            <div className="p-5 bg-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-4"
                >
                  <span className="text-4xl shrink-0 mt-0.5 select-none">{quest.emoji}</span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-extrabold text-base leading-tight text-foreground">
                      {quest.title}
                    </h4>
                    <p className="text-xs text-foreground/50 leading-normal">
                      {quest.description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Reward Badge & Time Limit */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-card-border/50">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFB300]/10 text-[#FFB300] border border-[#FFB300]/15">
                  <Gift className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black">{quest.reward}</span>
                </div>
                <div className="flex items-center gap-1 text-foreground/40 text-[10px] font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hari ini</span>
                </div>
              </div>

              {/* Dots Pagination Indicators */}
              <div className="flex justify-center gap-1.5 mt-4">
                {quests.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuest(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentQuest ? "bg-[#FFB300] w-4" : "bg-foreground/15 hover:bg-foreground/25"
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
