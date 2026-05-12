"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDriver, registerDriver } from "@/lib/firestoreDriver";
import { useRouter } from "next/navigation";
import { Loader2, Truck, Mail, Lock, User, Phone } from "lucide-react";

export default function KangDoMieLogin() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const driver = await getDriver(cred.user.uid);
      if (!driver) {
        setError("Akun ini bukan akun KangDoMie. Silakan daftar dulu.");
        setLoading(false);
        return;
      }
      if (!driver.isApproved) {
        setError("Akun kamu belum diapprove oleh Admin. Hubungi admin Mienian.");
        setLoading(false);
        return;
      }
      router.push("/kangdomie/dashboard");
    } catch (err: any) {
      setError(err.message?.includes("invalid-credential") ? "Email atau password salah." : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !phone) {
      setError("Lengkapi semua field.");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await registerDriver(cred.user.uid, { name, phone, gerobakId: "" });
      setError("");
      setIsRegister(false);
      alert("Registrasi berhasil! Tunggu approval dari Admin Mienian.");
    } catch (err: any) {
      setError(err.message?.includes("email-already-in-use") ? "Email sudah terdaftar." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-[#FF6B6B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/30">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">KangDoMie</h1>
          <p className="text-white/50 text-sm mt-1">Driver App — Mienian GO</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">
            {isRegister ? "Daftar Jadi KangDoMie" : "Login KangDoMie"}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-wider">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama driver"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-wider">No. HP / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@mienian.id"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-[#FF6B6B] text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
              ) : isRegister ? (
                "Daftar Sekarang"
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              {isRegister ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}
            </button>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © 2026 Mienian · KangDoMie Driver App
        </p>
      </motion.div>
    </div>
  );
}
