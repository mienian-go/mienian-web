"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAffiliateByEmail, getOrdersByAffiliateCode } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { LogIn, Link2, Copy, Check, TrendingUp, Package, DollarSign, Clock, ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";

interface AffiliateData {
  id: string;
  name: string;
  email: string;
  status: string;
  approvedCode: string;
  [key: string]: any;
}

interface OrderData {
  id: string;
  orderId?: string;
  totalPrice: number;
  status: string;
  event?: { picName?: string; date?: string; [key: string]: any };
  createdAt: any;
  [key: string]: any;
}

export default function AffiliateDashboardPage() {
  // Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard State
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);

  const { user, logout: signOutUser } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Auto login if already authenticated
  useEffect(() => {
    async function checkAffiliate() {
      if (user?.email) {
        try {
          const affData = await getAffiliateByEmail(user.email);
          if (affData) {
            const aff = affData as AffiliateData;
            if (aff.status === "approved") {
              const orderData = await getOrdersByAffiliateCode(aff.approvedCode);
              setAffiliate(aff);
              setOrders(orderData as OrderData[]);
              setIsLoggedIn(true);
            } else {
              setAuthError(
                aff.status === "pending"
                  ? "Akun Anda masih dalam proses review oleh tim kami. Mohon tunggu 1-2 hari kerja."
                  : "Pendaftaran Anda ditolak. Silakan hubungi admin."
              );
              // We don't sign them out of Firebase, just block dashboard access
            }
          }
        } catch (err) {
          console.error("Error checking affiliate status:", err);
        }
      }
      setCheckingAuth(false);
    }
    
    checkAffiliate();
  }, [user]);

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError("Silakan masukkan email Anda terlebih dahulu.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email pemulihan kata sandi telah dikirim. Silakan cek kotak masuk (atau spam) email Anda.");
    } catch (err: any) {
      setAuthError("Gagal mengirim email pemulihan: " + (err.message || "Coba lagi nanti."));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);

    try {
      // 1. Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);

      // 2. Look up affiliate record by email
      const affData = await getAffiliateByEmail(email);
      if (!affData) {
        setAuthError("Email ini tidak terdaftar sebagai affiliator. Silakan daftar terlebih dahulu.");
        setIsLoggingIn(false);
        return;
      }

      const aff = affData as AffiliateData;

      if (aff.status !== "approved") {
        setAuthError(
          aff.status === "pending"
            ? "Akun Anda masih dalam proses review oleh tim kami. Mohon tunggu 1-2 hari kerja."
            : "Pendaftaran Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut."
        );
        setIsLoggingIn(false);
        return;
      }

      // 3. Fetch orders with this affiliate code
      const orderData = await getOrdersByAffiliateCode(aff.approvedCode);
      setAffiliate(aff);
      setOrders(orderData as OrderData[]);
      setIsLoggedIn(true);
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setAuthError("Email atau password salah.");
      } else {
        setAuthError(err.message || "Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setAffiliate(null);
    setOrders([]);
    setEmail("");
    setPassword("");
    await signOutUser();
  };

  const copyLink = (path: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${path}?aff=${affiliate?.approvedCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ========== LOGIN SCREEN ==========
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card max-w-sm w-full rounded-3xl border border-card-border shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold">Dashboard Affiliator</h1>
            <p className="text-foreground/50 text-sm mt-1">Masuk dengan akun yang terdaftar.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg border border-red-500/20">
                {authError}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground/70">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground/70">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all"
              />
              <div className="flex justify-end mt-1.5">
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {isLoggingIn ? "Memverifikasi..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-foreground/40">
            Belum terdaftar?{" "}
            <Link href="/affiliate/register" className="text-primary font-bold hover:underline">
              Daftar di sini
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ========== DASHBOARD ==========
  const verifiedOrders = orders.filter(o => ["verified", "preparing", "completed", "payment_uploaded"].includes(o.status));
  const totalRevenue = verifiedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const commissionRate = 0.05; // 5%
  const totalCommission = Math.floor(totalRevenue * commissionRate);

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold">Halo, {affiliate?.name?.split(" ")[0]}! 👋</h1>
            <p className="text-foreground/50 mt-1">Pantau performa affiliate Anda secara real-time.</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-bold text-primary hover:bg-primary/20 transition-all"
            >
              <Package className="w-4 h-4" /> Dashboard Pelanggan
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-card-border rounded-xl text-sm font-bold text-foreground/60 hover:text-foreground hover:border-primary/40 transition-all"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>

        {/* Affiliate Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 via-card to-secondary/5 border-2 border-primary/20 rounded-3xl p-6 sm:p-8 mb-8"
        >
          <h2 className="font-bold text-sm text-primary mb-4 flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Link Affiliate Anda
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground/50 w-20 shrink-0">Kode:</span>
              <span className="font-extrabold text-xl tracking-widest text-primary">{affiliate?.approvedCode}</span>
            </div>
            {["/menu/wedding", "/menu/reguler"].map(path => (
              <div key={path} className="flex items-center gap-2 bg-background/50 rounded-xl px-4 py-3 border border-card-border">
                <span className="text-xs text-foreground/50 truncate flex-1 font-mono">
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  {path}?aff={affiliate?.approvedCode}
                </span>
                <button
                  onClick={() => copyLink(path)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/80 transition-all"
                >
                  {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { title: "Total Order", value: verifiedOrders.length.toString(), icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
            { title: "Total Revenue", value: `Rp ${totalRevenue.toLocaleString("id-ID")}`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
            { title: "Estimasi Komisi (5%)", value: `Rp ${totalCommission.toLocaleString("id-ID")}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="card p-5"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-foreground/50 font-bold">{stat.title}</p>
                  <h3 className="text-lg font-extrabold tracking-tight">{stat.value}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="p-5 border-b border-card-border flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Riwayat Order dari Link Anda
            </h2>
            <span className="text-xs text-foreground/40">{orders.length} total</span>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-foreground/40">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold">Belum ada order masuk melalui link Anda.</p>
              <p className="text-xs mt-1">Mulai bagikan link di atas ke calon customer!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-foreground/50 uppercase bg-muted/50 border-b border-card-border">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order ID</th>
                    <th className="px-5 py-3 font-semibold">PIC</th>
                    <th className="px-5 py-3 font-semibold">Tanggal</th>
                    <th className="px-5 py-3 font-semibold">Total</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono font-medium text-xs">{order.orderId || order.id.slice(0, 8)}</td>
                      <td className="px-5 py-3">{order.event?.picName || "-"}</td>
                      <td className="px-5 py-3">{order.event?.date || "-"}</td>
                      <td className="px-5 py-3 font-bold">Rp {(order.totalPrice || 0).toLocaleString("id-ID")}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === "pending" || order.status === "pending_payment" ? "bg-zinc-500/20 text-zinc-400" :
                          order.status === "payment_uploaded" ? "bg-amber-500/20 text-amber-500" :
                          order.status === "verified" ? "bg-blue-500/20 text-blue-500" :
                          order.status === "completed" ? "bg-green-500/20 text-green-500" :
                          "bg-red-500/20 text-red-500"
                        }`}>
                          {order.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
