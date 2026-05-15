"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { getDriver, type KangDoMieDriver } from "@/lib/firestoreDriver";
import { getTodayAttendance } from "@/lib/firestoreDriverSales";
import { collection, query, where, orderBy, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/kangdomie/BottomNav";
import {
  Loader2, Clock, Package, AlertTriangle, RefreshCw, FileText,
  Plus, Send, ChevronDown, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatTime(ts: any): string {
  if (!ts?.toDate) return "-";
  return ts.toDate().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

interface ActivityLog {
  id: string;
  type: "refill" | "adjustment" | "report" | "checkin" | "checkout" | "sale";
  description: string;
  detail?: string;
  timestamp: any;
  icon: string;
  color: string;
}

export default function KangDoMieHistory() {
  const router = useRouter();
  const [driver, setDriver] = useState<KangDoMieDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportCategory, setReportCategory] = useState("bahan_rusak");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    if (!driver) return;
    fetchActivities();
  }, [driver]);

  const fetchActivities = async () => {
    if (!driver) return;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const startTs = Timestamp.fromDate(startOfDay);
    const endTs = Timestamp.fromDate(endOfDay);

    const logs: ActivityLog[] = [];

    // 1. Attendance (check-in / check-out)
    const att = await getTodayAttendance(driver.uid);
    if (att) {
      if (att.checkInTime) {
        logs.push({
          id: `checkin_${att.id}`,
          type: "checkin",
          description: "Check-in",
          detail: `Mulai bekerja pada ${formatTime(att.checkInTime)}`,
          timestamp: att.checkInTime,
          icon: "🟢",
          color: "text-green-400",
        });
      }
      if (att.checkOutTime) {
        logs.push({
          id: `checkout_${att.id}`,
          type: "checkout",
          description: "Check-out",
          detail: `Selesai bekerja pada ${formatTime(att.checkOutTime)}`,
          timestamp: att.checkOutTime,
          icon: "🔴",
          color: "text-red-400",
        });
      }
    }

    // 2. Inventory logs (refill / adjustment)
    try {
      const invQ = query(
        collection(db, "kangdomie_inventory_logs"),
        where("driverId", "==", driver.uid),
        where("createdAt", ">=", startTs),
        where("createdAt", "<=", endTs),
        orderBy("createdAt", "desc")
      );
      const invSnap = await getDocs(invQ);
      for (const d of invSnap.docs) {
        const data = d.data();
        logs.push({
          id: `inv_${d.id}`,
          type: data.type === "refill" ? "refill" : "adjustment",
          description: data.type === "refill" ? `Refill ${data.itemName}` : `Adjustment ${data.itemName}`,
          detail: `${data.previousStock} → ${data.newStock} (${data.delta > 0 ? "+" : ""}${data.delta})`,
          timestamp: data.createdAt,
          icon: data.type === "refill" ? "📦" : "🔧",
          color: data.type === "refill" ? "text-emerald-400" : "text-orange-400",
        });
      }
    } catch (e) {
      console.error("Failed to fetch inventory logs:", e);
    }

    // 3. Driver reports (issues)
    try {
      const repQ = query(
        collection(db, "kangdomie_reports"),
        where("driverId", "==", driver.uid),
        where("createdAt", ">=", startTs),
        where("createdAt", "<=", endTs),
        orderBy("createdAt", "desc")
      );
      const repSnap = await getDocs(repQ);
      for (const d of repSnap.docs) {
        const data = d.data();
        logs.push({
          id: `rep_${d.id}`,
          type: "report",
          description: `Laporan: ${data.categoryLabel || data.category}`,
          detail: data.message,
          timestamp: data.createdAt,
          icon: "⚠️",
          color: "text-amber-400",
        });
      }
    } catch (e) {
      console.error("Failed to fetch reports:", e);
    }

    // 4. Sales
    try {
      const salesQ = query(
        collection(db, "kangdomie_sales"),
        where("driverId", "==", driver.uid),
        where("createdAt", ">=", startTs),
        where("createdAt", "<=", endTs),
        orderBy("createdAt", "desc")
      );
      const salesSnap = await getDocs(salesQ);
      for (const d of salesSnap.docs) {
        const data = d.data();
        const itemNames = (data.items || []).map((i: any) => `${i.name} x${i.qty}`).join(", ");
        logs.push({
          id: `sale_${d.id}`,
          type: "sale",
          description: `Penjualan Rp ${(data.totalAmount || 0).toLocaleString("id-ID")}`,
          detail: itemNames,
          timestamp: data.createdAt,
          icon: "💰",
          color: "text-primary",
        });
      }
    } catch (e) {
      console.error("Failed to fetch sales:", e);
    }

    // Sort by timestamp desc
    logs.sort((a, b) => {
      const aMs = a.timestamp?.toMillis?.() || 0;
      const bMs = b.timestamp?.toMillis?.() || 0;
      return bMs - aMs;
    });

    setActivities(logs);
  };

  const reportCategories = [
    { id: "bahan_rusak", label: "Bahan Rusak / Busuk" },
    { id: "bahan_kurang", label: "Bahan Kurang / Tidak Ada" },
    { id: "peralatan", label: "Kerusakan Peralatan" },
    { id: "kendala_lokasi", label: "Kendala Lokasi" },
    { id: "lainnya", label: "Lainnya" },
  ];

  const handleSubmitReport = async () => {
    if (!driver || !reportText.trim()) return;
    setSubmitting(true);
    try {
      const catLabel = reportCategories.find(c => c.id === reportCategory)?.label || reportCategory;
      await addDoc(collection(db, "kangdomie_reports"), {
        driverId: driver.uid,
        driverName: driver.name,
        gerobakId: driver.gerobakId,
        category: reportCategory,
        categoryLabel: catLabel,
        message: reportText.trim(),
        status: "open",
        createdAt: Timestamp.now(),
      });
      setReportText("");
      setShowReportForm(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      fetchActivities();
    } catch (err) {
      console.error("Report failed:", err);
      alert("Gagal mengirim laporan.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-lg">Riwayat Hari Ini</h1>
            <p className="text-[10px] text-white/40">{todayStr}</p>
          </div>
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Lapor
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Report Form */}
        <AnimatePresence>
          {showReportForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl bg-amber-500/5 border border-amber-500/15 p-4 space-y-3">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Buat Laporan
                </h3>

                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none appearance-none"
                >
                  {reportCategories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#1a1a2e]">{cat.label}</option>
                  ))}
                </select>

                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Contoh: Telur 3 butir busuk, Indomie Goreng tidak ada bumbu pelengkap..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500 focus:outline-none resize-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/50 text-xs font-bold hover:bg-white/10 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={submitting || !reportText.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors disabled:opacity-30 flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Kirim Laporan
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Toast */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 flex items-center gap-2 text-green-400 text-xs font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              Laporan berhasil dikirim ke admin!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity Timeline */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest px-1 mb-3">
            Timeline Aktivitas — {activities.length} event
          </p>

          {activities.length === 0 ? (
            <div className="text-center py-12 text-white/20">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">Belum ada aktivitas hari ini</p>
              <p className="text-xs mt-1">Check-in dulu untuk mulai bekerja!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((act, i) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex gap-3 items-start"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1">
                    <span className="text-sm">{act.icon}</span>
                    {i < activities.length - 1 && (
                      <div className="w-px h-full min-h-[20px] bg-white/10 mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/5 p-3 mb-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-xs font-bold ${act.color}`}>{act.description}</p>
                      <span className="text-[10px] text-white/25 font-mono">{formatTime(act.timestamp)}</span>
                    </div>
                    {act.detail && (
                      <p className="text-[11px] text-white/40 leading-relaxed">{act.detail}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
