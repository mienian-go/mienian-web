"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ShoppingBag,
  Ticket,
  Globe,
  MapPin,
  Bell,
  HelpCircle,
  FileText,
  LogOut,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { updateUserProfile, getUserProfile } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";

const accountMenuItems = [
  { icon: ShoppingBag, label: "Pesananku", href: "#" },
  { icon: Ticket, label: "Voucherku", href: "#" },
  { icon: Globe, label: "Ganti Bahasa", href: "#" },
  { icon: MapPin, label: "Lokasi Tersimpan", href: "#" },
  { icon: Bell, label: "Push Notifications", href: "#" },
  { icon: HelpCircle, label: "Butuh Bantuan?", href: "#" },
];

const generalMenuItems = [
  { icon: FileText, label: "Syarat dan Ketentuan", href: "#" },
];

// ─── LOGIN / REGISTER VIEW ────────────────────────────────────────────────────
function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (isLogin) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getUserProfile(credential.user.uid);
        if (!profile) {
          await auth.signOut();
          setError("Email ini terdaftar sebagai Affiliate/Admin. Gunakan email pembeli biasa.");
        }
      } else {
        if (!name.trim()) { setError("Nama lengkap wajib diisi."); setIsLoading(false); return; }
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateUserProfile(credential.user.uid, {
          email,
          name: name.trim(),
          whatsapp: "",
        });
      }
    } catch (err: any) {
      const msg: Record<string, string> = {
        "auth/user-not-found": "Email tidak terdaftar.",
        "auth/wrong-password": "Kata sandi salah.",
        "auth/email-already-in-use": "Email sudah digunakan.",
        "auth/weak-password": "Kata sandi minimal 6 karakter.",
        "auth/invalid-email": "Format email tidak valid.",
        "auth/invalid-credential": "Email atau kata sandi salah.",
      };
      setError(msg[err.code] || err.message || "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-28">
      {/* Top hero */}
      <div className="relative bg-gradient-to-br from-[#C8102E] to-[#8B0000] pt-14 pb-20 px-6 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20 shadow-xl">
            <Image
              src="/images/mienian-logo-new.png"
              alt="Mienian"
              width={52}
              height={52}
              className="object-contain"
            />
          </div>
          <h1 className="text-white font-black text-2xl tracking-tight">Mienian</h1>
          <p className="text-white/70 text-xs mt-1">Warmindo Keliling · Mie & Oden</p>
        </div>
      </div>

      {/* Auth card floating */}
      <div className="px-5 -mt-10 relative z-10">
        <motion.div
          layout
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Tab switcher */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-4 text-sm font-black transition-colors ${
                isLogin ? "text-[#C8102E] border-b-2 border-[#C8102E]" : "text-gray-400"
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-4 text-sm font-black transition-colors ${
                !isLogin ? "text-[#C8102E] border-b-2 border-[#C8102E]" : "text-gray-400"
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#C8102E] focus:bg-white transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="Alamat Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#C8102E] focus:bg-white transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Kata Sandi"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#C8102E] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600 font-medium"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#C8102E] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-red-500/20 active:scale-[0.98] transition-all disabled:opacity-70 mt-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "Masuk ke Akun" : "Buat Akun Baru"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 pb-5">
            {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="text-[#C8102E] font-bold"
            >
              {isLogin ? "Daftar di sini" : "Masuk di sini"}
            </button>
          </p>
        </motion.div>

        {/* Benefit bullets */}
        <div className="mt-6 space-y-2.5">
          {[
            { emoji: "🍜", text: "Lacak pesanan Mienian GO real-time" },
            { emoji: "⚡", text: "Kumpulkan poin Mieniacs setiap order" },
            { emoji: "🎁", text: "Akses voucher & promo eksklusif member" },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <span className="text-lg">{item.emoji}</span>
              <span className="text-xs font-medium text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation activeTab="akun" />
    </div>
  );
}

// ─── PROFILE VIEW (after login) ───────────────────────────────────────────────
function ProfileView() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Pengguna";

  const handleLogout = async () => {
    try { await logout(); setShowLogoutConfirm(false); } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* HEADER */}
      <div className="bg-white px-5 pt-12 pb-6 border-b border-gray-100">
        <h1 className="text-center font-bold text-base text-gray-900 mb-6">Akun</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
              {user?.photoURL ? (
                <Image src={user.photoURL} alt="Avatar" width={48} height={48} className="object-cover w-full h-full" />
              ) : (
                <User className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <span className="font-bold text-base text-gray-900 block">{displayName}</span>
              <span className="text-[10px] text-gray-400">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={() => router.push("/akun/edit")}
            className="text-xs text-gray-500 font-semibold flex items-center gap-0.5 hover:text-gray-800 transition-colors"
          >
            Profil <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* QR MIENIACS CARD */}
      <div className="px-5 mt-4">
        <button 
          onClick={() => router.push("/akun/member")}
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center justify-between hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Image src="/images/mienian-logo-new.png" alt="QR" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-black text-sm text-gray-900 uppercase tracking-wide">Kasih Liat QR Mieniacs</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* AKUN MENU */}
      <div className="px-5 mt-6">
        <h3 className="text-xs font-black text-[#C8102E] uppercase tracking-wider mb-3 px-1">Akun</h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {accountMenuItems.map((item, index) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors ${index < accountMenuItems.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <div className="flex items-center gap-3.5">
                <item.icon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-800">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>
      </div>

      {/* UMUM MENU */}
      <div className="px-5 mt-6">
        <h3 className="text-xs font-black text-[#C8102E] uppercase tracking-wider mb-3 px-1">Umum</h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {generalMenuItems.map((item, index) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors ${index < generalMenuItems.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <div className="flex items-center gap-3.5">
                <item.icon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-800">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>
      </div>

      {/* LOGOUT */}
      <div className="px-5 mt-6">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-white border border-red-100 rounded-2xl px-4 py-4 flex items-center gap-3.5 hover:bg-red-50 active:scale-[0.98] transition-all shadow-sm"
        >
          <LogOut className="w-5 h-5 text-[#C8102E]" />
          <span className="text-sm font-bold text-[#C8102E]">Keluar dari Akun</span>
        </button>
      </div>

      <div className="text-center mt-8 mb-4">
        <p className="text-[10px] text-gray-400">Mienian Mobile v0.1.0</p>
      </div>

      {/* LOGOUT CONFIRM MODAL */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-6 max-w-xs w-full text-center"
            >
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-7 h-7 text-[#C8102E]" />
              </div>
              <h3 className="font-black text-lg text-gray-900 mb-2">Keluar?</h3>
              <p className="text-xs text-gray-500 mb-6">Kamu yakin ingin keluar dari akun ini?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-[#C8102E] text-white font-bold rounded-xl text-sm"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavigation activeTab="akun" />
    </div>
  );
}

// ─── ROOT PAGE ─────────────────────────────────────────────────────────────────
export default function AkunPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-[#C8102E] animate-spin" />
      </div>
    );
  }

  return user ? <ProfileView /> : <AuthView />;
}
