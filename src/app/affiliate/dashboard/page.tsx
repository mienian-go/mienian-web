"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAffiliateByEmail, getOrdersByAffiliateCode, getAffiliateAssets, AffiliateAsset, updateAffiliateProfile } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { LogIn, Link2, Copy, Check, TrendingUp, Package, DollarSign, Clock, ExternalLink, LogOut, Video, Download, Settings, Save, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const [assets, setAssets] = useState<AffiliateAsset[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);

  // Tabs & Profile State
  const [activeTab, setActiveTab] = useState<"ringkasan" | "profil">("ringkasan");
  const [profileData, setProfileData] = useState({ name: "", whatsapp: "", bankName: "", bankAccount: "", bankAccountName: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

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
              const [orderData, assetData] = await Promise.all([
                getOrdersByAffiliateCode(aff.approvedCode),
                getAffiliateAssets()
              ]);
              setAffiliate(aff);
              setProfileData({
                name: aff.name || "",
                whatsapp: aff.whatsapp || "",
                bankName: aff.bankName || "",
                bankAccount: aff.bankAccount || "",
                bankAccountName: aff.bankAccountName || ""
              });
              setOrders(orderData as OrderData[]);
              setAssets(assetData);
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

      // 3. Fetch orders and assets
      const [orderData, assetData] = await Promise.all([
        getOrdersByAffiliateCode(aff.approvedCode),
        getAffiliateAssets()
      ]);
      setAffiliate(aff);
      setProfileData({
        name: aff.name || "",
        whatsapp: aff.whatsapp || "",
        bankName: aff.bankName || "",
        bankAccount: aff.bankAccount || "",
        bankAccountName: aff.bankAccountName || ""
      });
      setOrders(orderData as OrderData[]);
      setAssets(assetData);
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
    setAssets([]);
    setEmail("");
    setPassword("");
    await signOutUser();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate?.id) return;
    setIsUpdatingProfile(true);
    setProfileMessage({ type: "", text: "" });

    try {
      await updateAffiliateProfile(affiliate.id, profileData);
      setProfileMessage({ type: "success", text: "Profil berhasil diperbarui!" });
      setAffiliate({ ...affiliate, ...profileData });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: "Gagal memperbarui profil: " + err.message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const copyLink = (path: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${path}?aff=${affiliate?.approvedCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAffiliateLink = () => {
    if (typeof window !== "undefined" && affiliate?.approvedCode) {
      return `${window.location.origin}/menu/wedding?aff=${affiliate.approvedCode}`;
    }
    return "";
  };

  const copyCaption = (captionTemplate: string, id: string) => {
    const link = getAffiliateLink();
    const finalCaption = captionTemplate.replace(/{LINK}/g, link);
    navigator.clipboard.writeText(finalCaption);
    setCopiedCaptionId(id);
    setTimeout(() => setCopiedCaptionId(null), 2000);
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

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-card p-1.5 rounded-2xl border border-white/5 shadow-sm">
          <button 
            onClick={() => setActiveTab("ringkasan")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "ringkasan" ? "bg-primary text-white shadow-md" : "text-foreground/60 hover:text-foreground hover:bg-white/5"}`}
          >
            <TrendingUp className="w-4 h-4" /> Ringkasan
          </button>
          <button 
            onClick={() => setActiveTab("profil")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "profil" ? "bg-primary text-white shadow-md" : "text-foreground/60 hover:text-foreground hover:bg-white/5"}`}
          >
            <Settings className="w-4 h-4" /> Pengaturan Profil
          </button>
        </div>

        {activeTab === "ringkasan" ? (
          <>
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

        {/* Marketing Assets */}
        {assets.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-extrabold mb-2">Materi Promosi Siap Share</h2>
            <p className="text-foreground/50 text-sm mb-6">Download video ke HP Anda, lalu copy teks di bawah untuk diposting di WhatsApp atau sosmed Anda.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map(asset => (
                <div key={asset.id} className="card overflow-hidden shadow-xl border-white/5 flex flex-col">
                  <div className="aspect-video bg-black relative">
                    <video src={asset.videoUrl} controls className="w-full h-full object-contain" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-3">{asset.title}</h3>
                    <div className="bg-background rounded-xl border border-white/5 p-3 mb-4 flex-1">
                      <p className="text-xs text-foreground/60 whitespace-pre-wrap font-mono">
                        {asset.captionTemplate.replace(/{LINK}/g, getAffiliateLink())}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <a
                        href={asset.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-card border border-card-border rounded-lg text-sm font-bold hover:border-primary/40 transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                      <button
                        onClick={() => copyCaption(asset.captionTemplate, asset.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all"
                      >
                        {copiedCaptionId === asset.id ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Text</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-white/5 rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Pengaturan Profil</h2>
                <p className="text-sm text-foreground/50">Perbarui data diri dan informasi rekening bank Anda.</p>
              </div>
            </div>

            {profileMessage.text && (
              <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${profileMessage.type === "success" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                {profileMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
                <p className="text-sm font-bold leading-relaxed">{profileMessage.text}</p>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold mb-2 text-foreground/70 uppercase tracking-wider">Nama Lengkap</label>
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all" required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-foreground/70 uppercase tracking-wider">Nomor WhatsApp</label>
                  <input type="tel" value={profileData.whatsapp} onChange={e => setProfileData({...profileData, whatsapp: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all" required />
                </div>
                <div className="md:col-span-2 border-t border-white/5 pt-6 mt-2">
                  <h3 className="text-sm font-bold text-foreground/80 mb-4 uppercase tracking-wider">Informasi Rekening (Untuk Komisi)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-2 text-foreground/70 uppercase">Nama Bank / E-Wallet</label>
                      <input type="text" placeholder="BCA / GoPay / OVO" value={profileData.bankName} onChange={e => setProfileData({...profileData, bankName: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-2 text-foreground/70 uppercase">Nomor Rekening</label>
                      <input type="text" placeholder="123456789" value={profileData.bankAccount} onChange={e => setProfileData({...profileData, bankAccount: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-2 text-foreground/70 uppercase">Atas Nama</label>
                      <input type="text" placeholder="Budi Santoso" value={profileData.bankAccountName} onChange={e => setProfileData({...profileData, bankAccountName: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={isUpdatingProfile} className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {isUpdatingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

      </div>
    </div>
  );
}
