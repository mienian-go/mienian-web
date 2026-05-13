"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDriver, type KangDoMieDriver } from "@/lib/firestoreDriver";
import { checkIn, checkOut, getTodayAttendance, type Attendance } from "@/lib/firestoreDriverSales";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/kangdomie/BottomNav";
import {
  Loader2, ScanLine, CheckCircle2, XCircle, Clock,
  LogIn, LogOut as LogOutIcon, Camera, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function KangDoMieScan() {
  const router = useRouter();
  const [driver, setDriver] = useState<KangDoMieDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [todayAtt, setTodayAtt] = useState<Attendance | null>(null);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/kangdomie/login"); return; }
      const d = await getDriver(user.uid);
      if (!d || !d.isApproved) { router.push("/kangdomie/login"); return; }
      setDriver(d);
      const att = await getTodayAttendance(user.uid);
      setTodayAtt(att);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const startScanning = async () => {
    if (!containerRef.current) return;
    setScanning(true);
    setResult(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          // Stop scanner immediately
          await scanner.stop();
          scannerRef.current = null;
          setScanning(false);
          handleScanResult(decodedText);
        },
        () => {} // ignore errors during scanning
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setScanning(false);
      setResult({ success: false, message: "Tidak bisa mengakses kamera. Pastikan izin kamera diberikan." });
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = async (barcode: string) => {
    if (!driver) return;

    // Determine action based on attendance status
    if (!todayAtt || todayAtt.status !== "checked_in") {
      // Check in
      const res = await checkIn(driver.uid, barcode);
      setResult(res);
      if (res.success) {
        const att = await getTodayAttendance(driver.uid);
        setTodayAtt(att);
      }
    } else {
      // Check out
      const res = await checkOut(driver.uid);
      setResult(res);
      if (res.success) {
        const att = await getTodayAttendance(driver.uid);
        setTodayAtt(att);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isCheckedIn = todayAtt?.status === "checked_in";
  const isCheckedOut = todayAtt?.status === "checked_out";
  const notYetCheckedIn = !todayAtt;

  const formatTime = (ts: any) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="font-extrabold text-lg">Scan eCard</h1>
          <p className="text-[10px] text-white/40">Absensi Check-in / Check-out harian</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Today Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 border ${
            isCheckedIn
              ? "border-green-500/30 bg-green-500/5"
              : isCheckedOut
              ? "border-zinc-500/30 bg-zinc-500/5"
              : "border-yellow-500/30 bg-yellow-500/5"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            {isCheckedIn ? (
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            ) : isCheckedOut ? (
              <CheckCircle2 className="w-8 h-8 text-zinc-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            )}
            <div>
              <p className="font-extrabold text-lg">
                {isCheckedIn ? "Sedang Bekerja" : isCheckedOut ? "Sudah Selesai" : "Belum Check-in"}
              </p>
              <p className="text-xs text-white/40">
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {todayAtt && (
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase">Check-in</p>
                  <p className="text-sm font-bold">{formatTime(todayAtt.checkInTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LogOutIcon className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase">Check-out</p>
                  <p className="text-sm font-bold">{todayAtt.checkOutTime ? formatTime(todayAtt.checkOutTime) : "—"}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Scanner Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div
            ref={containerRef}
            className="w-full aspect-square max-w-[300px] mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-white/10 bg-white/[0.02] relative"
          >
            <div id="qr-reader" className="w-full h-full" />
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <ScanLine className="w-16 h-16 text-white/10" />
                <p className="text-xs text-white/30 text-center px-4">
                  {isCheckedOut
                    ? "Kamu sudah check-in dan check-out hari ini"
                    : "Tap tombol di bawah untuk mulai scan eCard"}
                </p>
              </div>
            )}
          </div>

          {!isCheckedOut && (
            <button
              onClick={scanning ? stopScanning : startScanning}
              className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                scanning
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : isCheckedIn
                  ? "bg-orange-500 text-white"
                  : "bg-primary text-white"
              }`}
            >
              {scanning ? (
                <>
                  <XCircle className="w-4 h-4" /> Batal Scan
                </>
              ) : isCheckedIn ? (
                <>
                  <Camera className="w-4 h-4" /> Scan untuk Check-out
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" /> Scan eCard untuk Check-in
                </>
              )}
            </button>
          )}
        </motion.div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                result.success
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <p className={`text-sm font-bold ${result.success ? "text-emerald-400" : "text-red-400"}`}>
                {result.message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}
