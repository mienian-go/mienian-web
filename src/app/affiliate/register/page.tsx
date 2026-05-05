"use client";

import { useState } from "react";
import { registerAffiliate } from "@/lib/firestore";
import { CheckCircle2, UserPlus, Send, Link2, Globe, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function AffiliateRegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    whatsapp: "",
    socialMedia: "",
    requestedCode: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // 1. Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Save to Firestore with UID
      await registerAffiliate({
        ...formData,
        uid: userCredential.user.uid,
        password: "", // Don't store plain password in Firestore
      });
      
      setIsSuccess(true);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email ini sudah terdaftar. Silakan gunakan email lain atau hubungi admin.");
      } else if (err.code === "auth/weak-password") {
        setError("Kata sandi terlalu lemah (minimal 6 karakter).");
      } else {
        setError(err.message || "Gagal mendaftar. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card max-w-md w-full rounded-3xl border border-card-border shadow-2xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Pendaftaran Berhasil!</h1>
          <p className="text-foreground/60 mb-8 leading-relaxed">
            Terima kasih telah mendaftar sebagai affiliator Mienian. Tim kami akan meninjau profil Anda dalam 1-2 hari kerja. Informasi selanjutnya akan dikirim melalui WhatsApp/Email.
          </p>
          <Link href="/" className="inline-block w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Kembali ke Beranda
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        
        {/* Left Side: Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-4">
              <UserPlus className="w-3 h-3" /> Partnership Program
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight">
              Jadi Bagian dari <span className="text-primary italic">Mienian Family</span>
            </h1>
            <p className="mt-4 text-foreground/60 text-lg">
              Dapatkan komisi dari setiap pesanan katering yang datang melalui link affiliate unik Anda. Mari tumbuh bersama kami.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                <Send className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold">Daftar & Dapatkan Link</h3>
                <p className="text-sm text-foreground/60">Proses cepat dan mudah. Dapatkan dashboard khusus setelah disetujui.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold">Promosikan ke Relasi</h3>
                <p className="text-sm text-foreground/60">Bagikan ke penyelenggara acara, WO, atau komunitas Anda.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold">Cairkan Komisi</h3>
                <p className="text-sm text-foreground/60">Pantau setiap transaksi secara real-time dan tarik komisi bulanan.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-3xl border border-card-border shadow-2xl p-6 sm:p-8 relative"
        >
          <h2 className="text-xl font-bold mb-6">Formulir Pendaftaran</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg border border-red-500/20">{error}</div>}
            
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground/70">Nama Lengkap</label>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Contoh: Budi Santoso" 
                className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground/70">Email</label>
                <input 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="budi@example.com" 
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground/70">Kata Sandi (Min 6 Karakter)</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground/70">Nomor WhatsApp</label>
              <input 
                type="text" 
                required 
                value={formData.whatsapp}
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                placeholder="0812xxxxxxxx" 
                className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground/70 flex items-center gap-1.5">
                <Link2 className="w-3 h-3" /> Instagram / Social Media
              </label>
              <input 
                type="text" 
                required 
                value={formData.socialMedia}
                onChange={e => setFormData({...formData, socialMedia: e.target.value})}
                placeholder="@username atau link profil" 
                className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground/70">Request Kode Affiliate (Opsional)</label>
              <input 
                type="text" 
                value={formData.requestedCode}
                onChange={e => setFormData({...formData, requestedCode: e.target.value.toUpperCase()})}
                placeholder="CONTOH: BUDI10" 
                className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm font-bold tracking-widest transition-all" 
              />
              <p className="text-[10px] text-foreground/40 mt-1">Gunakan huruf kapital dan angka. Tanpa spasi.</p>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 bg-primary text-white font-extrabold rounded-xl mt-4 hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {isSubmitting ? "Mengirim Data..." : "Daftar Sekarang"}
            </button>
            
            <p className="text-[10px] text-center text-foreground/40 mt-4 leading-relaxed">
              Dengan mendaftar, Anda setuju dengan syarat dan ketentuan program afiliasi Mienian Catering.
            </p>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
