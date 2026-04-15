"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/data/menu";
import { QrCode, Building2, Copy, Check, ArrowRight, Shield, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { getSettings } from "@/lib/firestore";

export default function PaymentPage() {
  const router = useRouter();
  const { totalPrice, totalItems } = useCart();
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const bankAccount = settings?.bankAccount || "1234567890";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bankAccount);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = bankAccount;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3">Belum Ada Pesanan</h2>
          <p className="text-foreground/50 mb-8">Pilih paket catering dan isi detail acara dulu ya!</p>
          <Link href="/catering/menu" className="btn btn-primary btn-lg">
            <ArrowLeft className="w-4 h-4" />
            Lihat Menu
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tertiary/10 text-tertiary text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Secure Payment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
            Time to Secure the Bag 💰
          </h1>
          <p className="text-foreground/60 text-lg">
            Selesaikan payment biar slot tanggal acara lo aman sentosa. First pay, first serve ya!
          </p>
        </motion.div>

        {/* Total Amount */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5"
        >
          <p className="text-foreground/50 text-sm mb-1">Total Pembayaran</p>
          <p className="text-4xl font-extrabold text-primary">{formatRupiah(totalPrice)}</p>
        </motion.div>

        {/* ===== QRIS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 sm:p-8 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Tim Tinggal Scan (QRIS)</h3>
              <p className="text-foreground/50 text-xs">Paling cepat & gampang!</p>
            </div>
            <span className="ml-auto px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-xs font-bold">Recommended</span>
          </div>

          <div className="flex flex-col items-center">
            {/* QRIS Placeholder */}
            <div className="w-64 h-64 rounded-2xl bg-white flex items-center justify-center p-2 mb-4 overflow-hidden shadow-sm">
              {settings?.qrisImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.qrisImageUrl} alt="QRIS Mienian" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <QrCode className="w-24 h-24 text-foreground/10 mx-auto mb-2" />
                  <p className="text-xs text-foreground/30">QRIS Placeholder</p>
                </div>
              )}
            </div>
            <p className="text-foreground/50 text-sm text-center max-w-sm mb-4">
              Buka m-banking atau e-wallet favorit lo, scan barcode ini, kelar deh. Valid buat semua app yang ada logo QRIS-nya.
            </p>
            <button className="btn btn-outlined btn-sm">
              Simpan Gambar QRIS
            </button>
          </div>
        </motion.div>

        {/* ===== TRANSFER BANK ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 sm:p-8 mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Transfer Bank</h3>
              <p className="text-foreground/50 text-xs">Manual but make it sat-set</p>
            </div>
          </div>

          <p className="text-foreground/60 text-sm mb-4">Kirim ke rekening resmi kita di bawah ini:</p>

          <div className="bg-muted rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/50">Bank</span>
              <span className="font-bold">{settings?.bankName || "BCA"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/50">No. Rekening</span>
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono tracking-wider">{bankAccount}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    copied
                      ? "bg-tertiary/10 text-tertiary"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Berhasil di-copas!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/50">Atas Nama</span>
              <span className="font-bold">{settings?.bankHolder || "PT Mie Kekinian Sukses"}</span>
            </div>
          </div>
        </motion.div>

        {/* ===== CTA ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <button
            onClick={() => router.push("/catering/confirm")}
            className="btn btn-primary btn-lg"
          >
            Gue Udah Bayar! 🔥
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-foreground/40 text-xs mt-4">
            Pastikan transfer sesuai nominal ya. Selisih nominal bisa bikin proses verifikasi lebih lama.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
