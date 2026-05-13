"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDriver, type KangDoMieDriver } from "@/lib/firestoreDriver";
import {
  getSalesByDriver,
  getDriverCommissionForPeriod,
  getDateRange,
  getMonthlyAttendance,
  type KangDoMieSale,
} from "@/lib/firestoreDriverSales";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/kangdomie/BottomNav";
import { Loader2, TrendingUp, DollarSign, ShoppingBag, Briefcase, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

type Period = "daily" | "weekly" | "monthly";

export default function KangDoMieReport() {
  const router = useRouter();
  const [driver, setDriver] = useState<KangDoMieDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("daily");
  const [sales, setSales] = useState<KangDoMieSale[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, totalCommission: 0, count: 0 });
  const [workDays, setWorkDays] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

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
    fetchReport();
  }, [driver, period]);

  const fetchReport = async () => {
    if (!driver) return;
    const { start, end } = getDateRange(period);

    const [salesData, commissionData] = await Promise.all([
      getSalesByDriver(driver.uid, start, end),
      getDriverCommissionForPeriod(driver.uid, start, end),
    ]);

    setSales(salesData);
    setStats(commissionData);

    // Build chart data
    if (period === "daily") {
      // Group by hour
      const hourMap: Record<number, number> = {};
      salesData.forEach((s) => {
        const h = s.createdAt?.toDate?.()?.getHours?.() || 0;
        hourMap[h] = (hourMap[h] || 0) + s.totalAmount;
      });
      setChartData(
        Array.from({ length: 24 }, (_, i) => ({
          label: `${String(i).padStart(2, "0")}:00`,
          amount: hourMap[i] || 0,
        }))
      );
    } else if (period === "weekly") {
      const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const dayMap: Record<number, number> = {};
      salesData.forEach((s) => {
        const d = s.createdAt?.toDate?.()?.getDay?.() || 0;
        dayMap[d] = (dayMap[d] || 0) + s.totalAmount;
      });
      setChartData(dayNames.map((name, i) => ({ label: name, amount: dayMap[i] || 0 })));
    } else {
      // Monthly: group by date
      const dateMap: Record<number, number> = {};
      salesData.forEach((s) => {
        const d = s.createdAt?.toDate?.()?.getDate?.() || 1;
        dateMap[d] = (dateMap[d] || 0) + s.totalAmount;
      });
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      setChartData(
        Array.from({ length: daysInMonth }, (_, i) => ({
          label: `${i + 1}`,
          amount: dateMap[i + 1] || 0,
        }))
      );
    }

    // Attendance count
    const now = new Date();
    const att = await getMonthlyAttendance(driver.uid, now.getFullYear(), now.getMonth() + 1);
    setWorkDays(att.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="font-extrabold text-lg">Laporan Penjualan</h1>
          <p className="text-[10px] text-white/40">{driver?.name} — {driver?.gerobakId}</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {/* Period Tabs */}
        <div className="flex rounded-xl bg-white/5 p-1">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                period === p ? "bg-primary text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {p === "daily" ? "Hari Ini" : p === "weekly" ? "Minggu Ini" : "Bulan Ini"}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="col-span-2 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-white/40 font-bold uppercase">Total Penjualan</span>
            </div>
            <p className="text-2xl font-extrabold text-primary">{formatRupiah(stats.totalSales)}</p>
            <p className="text-xs text-white/40 mt-1">{stats.count} transaksi</p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] text-white/40 font-bold uppercase">Komisi</span>
            </div>
            <p className="text-lg font-extrabold text-yellow-400">{formatRupiah(stats.totalCommission)}</p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] text-white/40 font-bold uppercase">Hari Kerja</span>
            </div>
            <p className="text-lg font-extrabold text-blue-400">{workDays} hari</p>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/[0.03] border border-white/5 p-4"
        >
          <p className="text-xs font-bold text-white/40 uppercase mb-4">
            Grafik Penjualan — {period === "daily" ? "Per Jam" : period === "weekly" ? "Per Hari" : "Per Tanggal"}
          </p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
                  interval={period === "monthly" ? 4 : period === "daily" ? 3 : 0}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(val: any) => [formatRupiah(Number(val) || 0), "Penjualan"]}
                  labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.amount > 0 ? "#E53935" : "rgba(255,255,255,0.05)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Transaction List */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">Riwayat Transaksi</p>
          {sales.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-sm">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            sales.slice(0, 20).map((sale) => (
              <div key={sale.id} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      sale.saleType === "pos" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                    }`}>
                      {sale.saleType === "pos" ? "POS" : "Online"}
                    </span>
                    <span className="text-xs text-white/30">
                      {sale.createdAt?.toDate?.()?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className="font-bold text-sm">{formatRupiah(sale.totalAmount)}</span>
                </div>
                <p className="text-[10px] text-white/40">
                  {sale.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                </p>
                <p className="text-[10px] text-yellow-400 font-bold mt-1">
                  Komisi: +{formatRupiah(sale.commission)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
