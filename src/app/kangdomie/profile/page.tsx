"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDriver, type KangDoMieDriver } from "@/lib/firestoreDriver";
import { getDateRange, getDriverCommissionForPeriod, getTodayAttendance } from "@/lib/firestoreDriverSales";
import { updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/kangdomie/BottomNav";
import Image from "next/image";
import {
  Loader2, Camera, Mail, Phone, Hash, Truck, Award,
  Calendar, DollarSign, TrendingUp, Briefcase, LogOut, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import { deleteKangDoMieLocation } from "@/lib/firestoreGo";
import { setDriverOnline } from "@/lib/firestoreDriver";

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

export default function KangDoMieProfile() {
  const router = useRouter();
  const [driver, setDriver] = useState<KangDoMieDriver & { email?: string; photoURL?: string; totalSales?: number; totalCommission?: number; workDays?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [todayCommission, setTodayCommission] = useState(0);
  const [monthlyCommission, setMonthlyCommission] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/kangdomie/login"); return; }
      const d = await getDriver(user.uid);
      if (!d || !d.isApproved) { router.push("/kangdomie/login"); return; }

      setDriver({ ...d, email: user.email || "" } as any);
      setLoading(false);

      // Fetch commission data in background (non-blocking)
      try {
        const { start: todayStart, end: todayEnd } = getDateRange("daily");
        const todayData = await getDriverCommissionForPeriod(user.uid, todayStart, todayEnd);
        setTodayCommission(todayData.totalCommission);

        const { start: monthStart, end: monthEnd } = getDateRange("monthly");
        const monthData = await getDriverCommissionForPeriod(user.uid, monthStart, monthEnd);
        setMonthlyCommission(monthData.totalCommission);

        const att = await getTodayAttendance(user.uid);
        setTodayAttendance(att);
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      }
    });
    return () => unsub();
  }, [router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !driver) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const storageRef = ref(storage, `kangdomie_photos/${driver.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "kangdomie_drivers", driver.uid), { photoURL: url, updatedAt: Timestamp.now() });
      setDriver({ ...driver, photoURL: url } as any);
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  const handleLogout = async () => {
    if (driver) {
      await deleteKangDoMieLocation(driver.uid);
      await setDriverOnline(driver.uid, false);
    }
    await signOut(auth);
    router.push("/kangdomie/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!driver) return null;

  const stats = [
    { label: "Total Penjualan", value: formatRupiah(driver.totalSales || 0), icon: TrendingUp, color: "text-green-400" },
    { label: "Total Komisi", value: formatRupiah(driver.totalCommission || 0), icon: DollarSign, color: "text-yellow-400" },
    { label: "Hari Kerja", value: `${driver.workDays || 0} hari`, icon: Briefcase, color: "text-blue-400" },
    { label: "Komisi Hari Ini", value: formatRupiah(todayCommission), icon: Award, color: "text-emerald-400" },
    { label: "Komisi Bulan Ini", value: formatRupiah(monthlyCommission), icon: Calendar, color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <div className="relative pt-12 pb-8 px-6 text-center">
          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 bg-white/5">
              {(driver as any).photoURL ? (
                <Image src={(driver as any).photoURL} alt={driver.name} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white/30">
                  {driver.name.charAt(0)}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>

          <h1 className="text-xl font-extrabold">{driver.name}</h1>
          <p className="text-sm text-white/40 font-mono">{driver.gerobakId}</p>

          {/* Attendance badge */}
          {todayAttendance && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-3 ${
              todayAttendance.status === "checked_in"
                ? "bg-green-500/20 text-green-400"
                : "bg-zinc-500/20 text-zinc-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${todayAttendance.status === "checked_in" ? "bg-green-400" : "bg-zinc-400"}`} />
              {todayAttendance.status === "checked_in" ? "Sudah Check-in" : "Sudah Check-out"}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Info Cards (read-only) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">Informasi Akun</h3>
          <div className="card bg-white/[0.03] border border-white/5 rounded-2xl divide-y divide-white/5">
            <div className="flex items-center gap-3 p-4">
              <Mail className="w-4 h-4 text-white/30" />
              <div className="flex-1">
                <p className="text-[10px] text-white/30 font-bold uppercase">Email</p>
                <p className="text-sm">{(driver as any).email || "-"}</p>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/30">Read-only</span>
            </div>
            <div className="flex items-center gap-3 p-4">
              <Phone className="w-4 h-4 text-white/30" />
              <div className="flex-1">
                <p className="text-[10px] text-white/30 font-bold uppercase">No. HP</p>
                <p className="text-sm">{driver.phone}</p>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/30">Read-only</span>
            </div>
            <div className="flex items-center gap-3 p-4">
              <Hash className="w-4 h-4 text-white/30" />
              <div className="flex-1">
                <p className="text-[10px] text-white/30 font-bold uppercase">Gerobak ID</p>
                <p className="text-sm font-mono">{driver.gerobakId}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">Statistik</h3>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, i) => (
              <div key={i} className={`card bg-white/[0.03] border border-white/5 rounded-2xl p-4 ${i === 0 ? "col-span-2" : ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-[10px] text-white/40 font-bold uppercase">{stat.label}</span>
                </div>
                <p className={`text-lg font-extrabold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Withdraw Button — only available near end of month (28-31) */}
        {(() => {
          const today = new Date().getDate();
          const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
          const canWithdraw = today >= 28 && today <= lastDay;
          const totalComm = driver.totalCommission || 0;
          return canWithdraw && totalComm > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <button
                onClick={async () => {
                  if (!confirm(`Withdraw komisi ${formatRupiah(totalComm)}? Request akan dikirim ke admin.`)) return;
                  try {
                    const { addDoc, collection, Timestamp: TS } = await import("firebase/firestore");
                    await addDoc(collection(db, "kangdomie_withdrawals"), {
                      driverId: driver.uid,
                      driverName: driver.name,
                      amount: totalComm,
                      status: "pending",
                      requestedAt: TS.now(),
                    });
                    alert("Request withdraw berhasil dikirim! Admin akan memproses dalam 1-3 hari kerja.");
                  } catch (err) {
                    console.error("Withdraw failed:", err);
                    alert("Gagal mengirim request. Coba lagi nanti.");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 text-yellow-400 font-bold text-sm hover:from-yellow-500/30 transition-all"
              >
                <DollarSign className="w-4 h-4" />
                Withdraw Penghasilan — {formatRupiah(totalComm)}
              </button>
              <p className="text-[10px] text-white/30 text-center mt-1.5">Tersedia setiap tanggal 28-{lastDay}</p>
            </motion.div>
          ) : !canWithdraw ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="w-full py-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                <p className="text-xs text-white/30 font-bold">💰 Withdraw tersedia tanggal 28-{lastDay}</p>
                <p className="text-[10px] text-white/20 mt-0.5">Saldo: {formatRupiah(totalComm)}</p>
              </div>
            </motion.div>
          ) : null;
        })()}

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar dari Akun
          </button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
