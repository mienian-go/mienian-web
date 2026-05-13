"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDriver, type KangDoMieDriver } from "@/lib/firestoreDriver";
import { subscribeToLeaderboard } from "@/lib/firestoreDriverSales";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/kangdomie/BottomNav";
import Image from "next/image";
import { Loader2, Trophy, Medal, Crown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

const PODIUM_COLORS = [
  { bg: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/30", text: "text-yellow-400", icon: Crown },
  { bg: "from-zinc-300/20 to-zinc-400/5", border: "border-zinc-400/30", text: "text-zinc-300", icon: Medal },
  { bg: "from-amber-700/20 to-amber-800/5", border: "border-amber-700/30", text: "text-amber-600", icon: Medal },
];

export default function KangDoMieLeaderboard() {
  const router = useRouter();
  const [driver, setDriver] = useState<KangDoMieDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/kangdomie/login"); return; }
      const d = await getDriver(user.uid);
      if (!d || !d.isApproved) { router.push("/kangdomie/login"); return; }
      setDriver(d);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const unsub = subscribeToLeaderboard(10, (data) => {
      setLeaders(data);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent" />
        <header className="relative pt-6 pb-4 px-4 text-center">
          <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
          <h1 className="font-extrabold text-xl">Top 10 KangDoMie</h1>
          <p className="text-xs text-white/40">Ranking berdasarkan total penjualan</p>
        </header>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-5">
        {/* Podium — Top 3 */}
        {top3.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end justify-center gap-3 py-4"
          >
            {/* 2nd place */}
            {top3[1] && (
              <div className="flex flex-col items-center w-24">
                <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${PODIUM_COLORS[1].border} bg-white/5 mb-2`}>
                  {top3[1].photoURL ? (
                    <Image src={top3[1].photoURL} alt={top3[1].name} width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white/20">
                      {top3[1].name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <span className={`text-lg font-extrabold ${PODIUM_COLORS[1].text}`}>2</span>
                <p className="text-[10px] font-bold text-center leading-tight truncate w-full">{top3[1].name}</p>
                <p className="text-[9px] text-white/40">{formatRupiah(top3[1].totalSales || 0)}</p>
                <div className={`w-full h-16 rounded-t-xl bg-gradient-to-b ${PODIUM_COLORS[1].bg} mt-2`} />
              </div>
            )}

            {/* 1st place */}
            {top3[0] && (
              <div className="flex flex-col items-center w-28">
                <Crown className="w-6 h-6 text-yellow-400 mb-1" />
                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${PODIUM_COLORS[0].border} bg-white/5 mb-2`}>
                  {top3[0].photoURL ? (
                    <Image src={top3[0].photoURL} alt={top3[0].name} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white/20">
                      {top3[0].name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <span className={`text-2xl font-extrabold ${PODIUM_COLORS[0].text}`}>1</span>
                <p className="text-xs font-bold text-center leading-tight truncate w-full">{top3[0].name}</p>
                <p className="text-[10px] text-yellow-400 font-bold">{formatRupiah(top3[0].totalSales || 0)}</p>
                <div className={`w-full h-24 rounded-t-xl bg-gradient-to-b ${PODIUM_COLORS[0].bg} mt-2`} />
              </div>
            )}

            {/* 3rd place */}
            {top3[2] && (
              <div className="flex flex-col items-center w-24">
                <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${PODIUM_COLORS[2].border} bg-white/5 mb-2`}>
                  {top3[2].photoURL ? (
                    <Image src={top3[2].photoURL} alt={top3[2].name} width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white/20">
                      {top3[2].name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <span className={`text-lg font-extrabold ${PODIUM_COLORS[2].text}`}>3</span>
                <p className="text-[10px] font-bold text-center leading-tight truncate w-full">{top3[2].name}</p>
                <p className="text-[9px] text-white/40">{formatRupiah(top3[2].totalSales || 0)}</p>
                <div className={`w-full h-12 rounded-t-xl bg-gradient-to-b ${PODIUM_COLORS[2].bg} mt-2`} />
              </div>
            )}
          </motion.div>
        )}

        {/* Rest of leaderboard */}
        <div className="space-y-2">
          {rest.map((entry, i) => {
            const isMe = driver && entry.uid === driver.uid;
            return (
              <motion.div
                key={entry.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isMe
                    ? "border-primary/30 bg-primary/5"
                    : "border-white/5 bg-white/[0.03]"
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-extrabold text-white/40">
                  {entry.rank}
                </span>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 shrink-0">
                  {entry.photoURL ? (
                    <Image src={entry.photoURL} alt={entry.name} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white/20">
                      {entry.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {entry.name} {isMe && <span className="text-primary text-[10px]">(Kamu)</span>}
                  </p>
                  <p className="text-[10px] text-white/30 font-mono">{entry.gerobakId}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-sm">{formatRupiah(entry.totalSales || 0)}</p>
                  <p className="text-[9px] text-yellow-400">komisi {formatRupiah(entry.totalCommission || 0)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* My position if not in top 10 */}
        {driver && !leaders.find((l) => l.uid === driver.uid) && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-extrabold text-primary">
              —
            </span>
            <div className="flex-1">
              <p className="font-bold text-sm">{driver.name} <span className="text-primary text-[10px]">(Kamu)</span></p>
              <p className="text-[10px] text-white/40">Belum masuk Top 10 — semangat jualan! 🔥</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
