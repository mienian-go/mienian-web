"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Medal, Crown, Flame, ArrowLeft, Loader2, Star } from "lucide-react";
import Link from "next/link";

const LEVEL_NAMES = ["Newbie", "Reguler", "Mania", "Sultan", "Legend", "God Tier"];
const LEVEL_COLORS = ["#9E9E9E", "#4CAF50", "#FF9800", "#E91E63", "#9C27B0", "#FFD700"];

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
  level: number;
  totalOrders: number;
}

const RANK_ICONS = [Crown, Medal, Medal];
const RANK_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const q = query(
          collection(db, "user_points"),
          orderBy("points", "desc"),
          limit(50)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          userId: d.id,
          ...d.data(),
        })) as LeaderboardEntry[];

        setEntries(data);

        if (user) {
          const idx = data.findIndex((e) => e.userId === user.uid);
          setMyRank(idx >= 0 ? idx + 1 : null);
        }
      } catch (err) {
        console.error("Leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [user]);

  return (
    <div className="min-h-screen pt-24 pb-32 bg-muted/30">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/mienian-go" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-[#FFD54F] flex items-center justify-center shadow-lg shadow-secondary/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">Leaderboard</h1>
              <p className="text-foreground/50 text-sm">Siapa yang paling doyan mie? 🍜</p>
            </div>
          </div>
        </div>

        {/* My Rank */}
        {user && myRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 mb-6 border-primary/20 bg-primary/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-extrabold">
                  #{myRank}
                </div>
                <div>
                  <p className="font-bold text-sm">Peringkat Kamu</p>
                  <p className="text-xs text-foreground/50">dari {entries.length} pemain</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-primary">
                  {entries.find((e) => e.userId === user.uid)?.points.toLocaleString("id-ID") || 0}
                </p>
                <p className="text-[10px] text-foreground/40">poin</p>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <p className="text-foreground/40 text-lg font-bold">Belum ada data</p>
            <p className="text-foreground/30 text-sm mt-1">Pesan mie pertamamu untuk mulai! 🔥</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-3 mb-8"
              >
                {[1, 0, 2].map((idx) => {
                  const entry = entries[idx];
                  if (!entry) return null;
                  const isFirst = idx === 0;
                  const levelColor = LEVEL_COLORS[entry.level] || "#9E9E9E";

                  return (
                    <div
                      key={entry.userId}
                      className={`card p-4 text-center ${isFirst ? "ring-2 ring-secondary/30 -mt-4 pb-6" : ""}`}
                    >
                      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        idx === 0 ? "bg-yellow-400/20" : idx === 1 ? "bg-gray-300/20" : "bg-amber-600/20"
                      }`}>
                        {idx === 0 ? (
                          <Crown className="w-6 h-6 text-yellow-400" />
                        ) : (
                          <span className="text-xl font-extrabold" style={{ color: idx === 1 ? "#D4D4D4" : "#B45309" }}>
                            {idx === 1 ? "2" : "3"}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-sm truncate">{entry.displayName || "Anon"}</p>
                      <p className="font-extrabold text-lg" style={{ color: levelColor }}>
                        {entry.points.toLocaleString("id-ID")}
                      </p>
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-1"
                        style={{ backgroundColor: `${levelColor}20`, color: levelColor }}
                      >
                        {LEVEL_NAMES[entry.level] || "Newbie"}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Rest of leaderboard */}
            {entries.slice(entries.length >= 3 ? 3 : 0).map((entry, i) => {
              const rank = (entries.length >= 3 ? 3 : 0) + i + 1;
              const levelColor = LEVEL_COLORS[entry.level] || "#9E9E9E";
              const isMe = user?.uid === entry.userId;

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`card p-4 flex items-center gap-4 ${isMe ? "border-primary/30 bg-primary/5" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-extrabold text-foreground/40">
                    {rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {entry.displayName || "Anon"}
                      {isMe && <span className="text-primary ml-1 text-xs">(Kamu)</span>}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-foreground/40">
                      <span
                        className="px-1.5 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: `${levelColor}20`, color: levelColor }}
                      >
                        {LEVEL_NAMES[entry.level] || "Newbie"}
                      </span>
                      <span>{entry.totalOrders || 0} pesanan</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm">{entry.points.toLocaleString("id-ID")}</p>
                    <p className="text-[10px] text-foreground/40">poin</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
