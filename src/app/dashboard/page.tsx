"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOrdersByUserId } from "@/lib/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  LogOut, 
  User as UserIcon,
  ShoppingBag,
  CreditCard,
  MapPin,
  Calendar as CalendarIcon
} from "lucide-react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { formatRupiah } from "@/data/menu";
import { useRouter } from "next/navigation";

export default function CustomerDashboard() {
  const { user, role, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Admin users should be redirected to admin dashboard
    if (!authLoading && user && role) {
      router.push("/admin");
      return;
    }

    let isMounted = true;
    
    // Safety timeout: if still loading after 3s, force stop
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log("Loading timeout reached, forcing state update");
        setLoading(false);
      }
    }, 3000);

    if (user) {
      fetchOrders();
    } else if (!authLoading) {
      if (isMounted) setLoading(false);
    }

    return () => { 
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [user, authLoading, role]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getOrdersByUserId(user.uid);
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setAuthError("Gagal mengambil data pesanan.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError("Email atau password salah.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending_payment": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      case "payment_uploaded": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "verified": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "preparing": return "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20";
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_payment": return "Menunggu Pembayaran";
      case "payment_uploaded": return "Menunggu Verifikasi";
      case "verified": return "Pesanan Dikonfirmasi";
      case "preparing": return "Dalam Persiapan";
      case "completed": return "Selesai";
      default: return status.toUpperCase();
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // ========== LOGIN SCREEN ==========
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card max-w-sm w-full rounded-3xl border border-white/5 shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold">Dashboard Pelanggan</h1>
            <p className="text-foreground/50 text-sm mt-1">Masuk untuk melihat riwayat pesanan Anda.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg border border-red-500/20 text-center">
                {authError}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground/70 uppercase">Email</label>
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
              <label className="block text-xs font-bold mb-1.5 text-foreground/70 uppercase">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary focus:outline-none text-sm transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
            >
              {isLoggingIn ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-foreground/40">
            Belum punya akun? Pesan katering dulu ya!
          </div>
        </motion.div>
      </div>
    );
  }

  // ========== DASHBOARD SCREEN ==========
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Halo, Pelanggan Setia!</h1>
              <p className="text-foreground/50 font-medium">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-foreground/60 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all self-start"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Stats / Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Ringkasan Anda</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60 text-sm">Total Pesanan</span>
                  <span className="font-black text-xl">{orders.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60 text-sm">Aktif</span>
                  <span className="font-black text-xl text-amber-500">
                    {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Butuh Bantuan?</h3>
              <p className="text-xs text-foreground/50 mb-4 leading-relaxed">
                Ada kendala dengan pesanan Anda? Hubungi Customer Service kami melalui WhatsApp untuk respon cepat.
              </p>
              <a 
                href="https://wa.me/6285216706922" 
                target="_blank" 
                className="w-full py-3 bg-green-500 text-white rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
              >
                Chat WhatsApp
              </a>
            </div>
          </div>

          {/* Orders List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Riwayat Pesanan
            </h2>

            {orders.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-2">Belum ada pesanan</h3>
                <p className="text-foreground/50 text-sm mb-8">Anda belum pernah melakukan pemesanan katering.</p>
                <Link href="/menu/reguler" className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all">
                  Mulai Pesan Sekarang
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {orders.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="card overflow-hidden group hover:border-primary/30 transition-all"
                    >
                      <div className="p-5 flex flex-col sm:flex-row justify-between gap-4 border-b border-white/5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getStatusStyle(order.status)}`}>
                            {order.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-foreground/40 font-bold uppercase tracking-tighter">#{order.orderId || order.id.slice(0, 8)}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </div>
                            <h4 className="font-bold text-lg mt-0.5">{order.packageName || "Katering Reguler"}</h4>
                          </div>
                        </div>
                        <div className="text-right flex flex-col justify-center">
                          <p className="text-xs text-foreground/40 font-bold uppercase mb-1">Total Pembayaran</p>
                          <p className="text-xl font-black text-primary">{formatRupiah(order.totalPrice)}</p>
                        </div>
                      </div>
                      
                      <div className="p-5 bg-white/[0.02] grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-xs">
                          <CalendarIcon className="w-3.5 h-3.5 text-foreground/30" />
                          <div>
                            <p className="text-foreground/30 font-bold uppercase text-[9px]">Tanggal Event</p>
                            <p className="font-bold">{order.eventDate || order.event?.date || "-"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-foreground/30" />
                          <div className="truncate">
                            <p className="text-foreground/30 font-bold uppercase text-[9px]">Lokasi</p>
                            <p className="font-bold truncate max-w-[120px]">{order.city || order.event?.city || "-"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CreditCard className="w-3.5 h-3.5 text-foreground/30" />
                          <div>
                            <p className="text-foreground/30 font-bold uppercase text-[9px]">Metode</p>
                            <p className="font-bold uppercase">{order.paymentMethod || order.payment?.method || "Transfer"}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                           <Link 
                            href={`/payment?orderId=${order.id}`}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-primary hover:text-white hover:border-transparent transition-all group/btn"
                           >
                            Detail <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                           </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
