"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { upsertKangDoMieLocation, deleteKangDoMieLocation, subscribeToChatMessages, sendChatMessage, type ChatMessage } from "@/lib/firestoreGo";
import {
  getDriver,
  setDriverOnline,
  subscribeToDriverOrders,
  subscribeToUnassignedOrders,
  acceptOrder,
  updateOrderStatusDriver,
  type KangDoMieDriver,
  type KangDoMieOrder,
} from "@/lib/firestoreDriver";
import { getDateRange, getDriverCommissionForPeriod } from "@/lib/firestoreDriverSales";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/kangdomie/BottomNav";
import Image from "next/image";
import {
  Loader2, LogOut, MapPin, Power, Package, Clock, CheckCircle2,
  Navigation, Phone, User, ChevronRight, Truck, Flame, AlertCircle,
  MessageCircle, Send, X, DollarSign, ShoppingBag,
} from "lucide-react";

const STATUS_FLOW: Record<string, { next: string; label: string; color: string }> = {
  paid: { next: "preparing", label: "Terima Pesanan", color: "bg-green-500" },
  preparing: { next: "cooking", label: "Mulai Masak 🔥", color: "bg-orange-500" },
  cooking: { next: "delivering", label: "Siap Antar 🛺", color: "bg-blue-500" },
  delivering: { next: "delivered", label: "Sudah Sampai ✅", color: "bg-emerald-500" },
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Menunggu",
  preparing: "Diterima",
  cooking: "Sedang Dimasak 🔥",
  delivering: "Dalam Perjalanan 🛺",
  delivered: "Selesai ✅",
};

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

export default function KangDoMieDashboard() {
  const router = useRouter();
  const [driver, setDriver] = useState<KangDoMieDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [myOrders, setMyOrders] = useState<KangDoMieOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<KangDoMieOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "my">("available");
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [todayCommission, setTodayCommission] = useState(0);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/kangdomie/login");
        return;
      }
      const d = await getDriver(user.uid);
      if (!d || !d.isApproved) {
        router.push("/kangdomie/login");
        return;
      }
      setDriver(d);
      setIsOnline(d.isOnline);

      // Fetch today's commission
      const { start, end } = getDateRange("daily");
      const commData = await getDriverCommissionForPeriod(user.uid, start, end);
      setTodayCommission(commData.totalCommission);

      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // Subscribe to orders
  useEffect(() => {
    if (!driver) return;

    const unsub1 = subscribeToDriverOrders(driver.uid, (orders) => {
      setMyOrders(orders.filter((o) => o.status !== "delivered" && o.status !== "payment_failed" && o.status !== "payment_expired"));
    });

    const unsub2 = subscribeToUnassignedOrders("", (orders) => {
      setAvailableOrders(orders);
    });

    return () => { unsub1(); unsub2(); };
  }, [driver]);

  // Subscribe to menu items (stock display)
  useEffect(() => {
    const q = query(collection(db, "menu_items"), orderBy("sortOrder", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMenuItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((i: any) => i.isActive));
    });
    return () => unsub();
  }, []);

  // GPS tracking
  const startGPS = useCallback(() => {
    if (!driver || !navigator.geolocation) return;

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    // Push to Firestore every 10 seconds
    gpsIntervalRef.current = setInterval(async () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await upsertKangDoMieLocation(driver.uid, {
              name: `KangDoMie — ${driver.name}`,
              driverName: driver.name,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              status: "available",
              eta: "~5 min",
              lastUpdated: null,
            });
          } catch (err) {
            console.error("Failed to push location:", err);
          }
        },
        (err) => console.error("GPS push error:", err),
        { enableHighAccuracy: true }
      );
    }, 10000);
  }, [driver]);

  const stopGPS = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (gpsIntervalRef.current) {
      clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
    }
    // Delete location from Firestore completely
    if (driver) {
      try {
        await deleteKangDoMieLocation(driver.uid);
      } catch (err) {
        console.error("Failed to delete location:", err);
      }
    }
  }, [driver]);

  const toggleOnline = async () => {
    if (!driver) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await setDriverOnline(driver.uid, newStatus);

    if (newStatus) {
      startGPS();
    } else {
      await stopGPS();
    }
  };

  // Cleanup GPS on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    };
  }, []);

  // Auto-start GPS if driver was online
  useEffect(() => {
    if (driver && isOnline) {
      startGPS();
    }
  }, [driver, isOnline, startGPS]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!driver) return;
    setProcessingOrder(orderId);
    try {
      await acceptOrder(orderId, driver.uid);
      setActiveTab("my");
    } catch (err) {
      console.error("Failed to accept:", err);
    }
    setProcessingOrder(null);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setProcessingOrder(orderId);
    try {
      await updateOrderStatusDriver(orderId, newStatus);
    } catch (err) {
      console.error("Failed to update:", err);
    }
    setProcessingOrder(null);
  };

  const handleLogout = async () => {
    await stopGPS();
    if (driver) await setDriverOnline(driver.uid, false);
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

  const activeOrders = myOrders.length;

  const formatRupiahLocal = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white pb-24">
      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-50 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5">
              <Image src="/kangdomie-icon.png" alt="KangDoMie" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{driver.name}</p>
              <p className="text-[10px] text-white/40">{driver.gerobakId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-[9px] text-yellow-400/60 font-bold">KOMISI HARI INI</p>
              <p className="text-xs font-extrabold text-yellow-400">{formatRupiahLocal(todayCommission)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* ========== ONLINE TOGGLE ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 border transition-all duration-500 ${
            isOnline
              ? "bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/30"
              : "bg-white/5 border-white/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">{isOnline ? "Kamu Online 🟢" : "Kamu Offline"}</p>
              <p className="text-xs text-white/50 mt-1">
                {isOnline
                  ? "Lokasi GPS dikirim setiap 10 detik ke pelanggan"
                  : "Nyalakan untuk mulai terima pesanan"}
              </p>
              {isOnline && userLocation && (
                <p className="text-[10px] text-white/30 mt-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </p>
              )}
            </div>
            <button
              onClick={toggleOnline}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isOnline
                  ? "bg-green-500 shadow-lg shadow-green-500/30 hover:bg-green-600"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              <Power className={`w-7 h-7 ${isOnline ? "text-white" : "text-white/50"}`} />
            </button>
          </div>
        </motion.div>

        {/* ========== STATS ========== */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{activeOrders}</p>
            <p className="text-[10px] text-white/40 mt-1">Pesanan Aktif</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-secondary">{availableOrders.length}</p>
            <p className="text-[10px] text-white/40 mt-1">Menunggu</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-400">
              {isOnline ? "ON" : "OFF"}
            </p>
            <p className="text-[10px] text-white/40 mt-1">Status GPS</p>
          </div>
        </div>

        {/* ========== MENU DISPLAY (Barang Jualan) ========== */}
        {menuItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" /> Barang Jualan
              </h3>
              <span className="text-[10px] text-white/30">{menuItems.length} item</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1 no-scrollbar">
              {menuItems.map((item: any) => (
                <div key={item.id} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                  <p className="font-bold text-xs leading-tight mb-1 truncate">{item.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-primary font-bold">{formatRupiahLocal(item.price)}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.stock !== undefined && item.stock <= 3 ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/40"}`}>
                      {item.stock !== undefined ? `Stok: ${item.stock}` : "∞"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ========== TABS ========== */}
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab("available")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "available"
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "text-white/50 hover:text-white"
            }`}
          >
            📦 Tersedia ({availableOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "my"
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "text-white/50 hover:text-white"
            }`}
          >
            🛺 Pesananku ({myOrders.length})
          </button>
        </div>

        {/* ========== ORDER LIST ========== */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {activeTab === "available" ? (
              availableOrders.length === 0 ? (
                <motion.div
                  key="empty-available"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Belum ada pesanan masuk</p>
                  <p className="text-white/20 text-xs mt-1">Pastikan status kamu Online</p>
                </motion.div>
              ) : (
                availableOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    type="available"
                    processing={processingOrder === order.id}
                    onAccept={() => handleAcceptOrder(order.id)}
                  />
                ))
              )
            ) : (
              myOrders.length === 0 ? (
                <motion.div
                  key="empty-my"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Truck className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Belum ada pesanan yang kamu ambil</p>
                </motion.div>
              ) : (
                myOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    type="my"
                    processing={processingOrder === order.id}
                    onUpdateStatus={(status) => handleUpdateStatus(order.id, status)}
                    driverName={driver?.name}
                    driverUid={driver?.uid}
                  />
                ))
              )
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// ============================================
// ORDER CARD COMPONENT
// ============================================

function OrderCard({
  order,
  type,
  processing,
  onAccept,
  onUpdateStatus,
  driverName,
  driverUid,
}: {
  order: KangDoMieOrder;
  type: "available" | "my";
  processing: boolean;
  onAccept?: () => void;
  onUpdateStatus?: (status: string) => void;
  driverName?: string;
  driverUid?: string;
}) {
  const statusInfo = STATUS_FLOW[order.status];
  const items = order.items || [];
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatOpen || type !== "my") return;
    const unsub = subscribeToChatMessages(order.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [chatOpen, order.id, type]);

  const handleSendMsg = async () => {
    if (!newMsg.trim() || sending || !driverUid) return;
    setSending(true);
    try {
      await sendChatMessage(order.id, {
        senderId: driverUid,
        senderName: driverName || "KangDoMie",
        senderRole: "driver",
        message: newMsg.trim(),
      });
      setNewMsg("");
    } catch (err) { console.error(err); }
    setSending(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            order.status === "paid" ? "bg-yellow-400 animate-pulse" :
            order.status === "cooking" ? "bg-orange-400 animate-pulse" :
            order.status === "delivering" ? "bg-blue-400 animate-pulse" :
            "bg-green-400"
          }`} />
          <div>
            <p className="font-bold text-sm">#{order.orderId || order.id.slice(-6)}</p>
            <p className="text-[10px] text-white/40">{STATUS_LABELS[order.status] || order.status}</p>
          </div>
        </div>
        <p className="font-extrabold text-primary text-sm">
          {formatRupiah(order.costs?.grandTotal || 0)}
        </p>
      </div>

      {/* Customer info */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-3.5 h-3.5 text-white/30" />
          <span className="text-white/70">{order.customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-3.5 h-3.5 text-white/30" />
          <span className="text-white/50 text-xs">{order.address}</span>
        </div>
        {order.whatsapp && (
          <a
            href={`https://wa.me/${order.whatsapp.replace(/^0/, "62")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="text-xs">{order.whatsapp}</span>
          </a>
        )}

        {/* Items */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-bold">Items</p>
          <div className="space-y-1">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-white/60">{item.quantity}x {item.name}</span>
                <span className="text-white/40">{formatRupiah(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action */}
      {type === "available" && onAccept && (
        <div className="p-4 pt-0">
          <button
            onClick={onAccept}
            disabled={processing}
            className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Ambil Pesanan
          </button>
        </div>
      )}

      {type === "my" && statusInfo && onUpdateStatus && (
        <div className="p-4 pt-0">
          <button
            onClick={() => onUpdateStatus(statusInfo.next)}
            disabled={processing}
            className={`w-full py-3 rounded-xl ${statusInfo.color} hover:opacity-90 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            {statusInfo.label}
          </button>
        </div>
      )}

      {type === "my" && order.status === "delivered" && (
        <div className="p-4 pt-0">
          <div className="w-full py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-sm text-center">
            ✅ Pesanan Selesai
          </div>
        </div>
      )}

      {/* Chat button for my orders */}
      {type === "my" && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {chatOpen ? "Tutup Chat" : `Chat Customer (${messages.length})`}
          </button>

          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 border border-white/10 rounded-xl overflow-hidden">
                  <div className="max-h-[200px] overflow-y-auto p-3 space-y-2">
                    {messages.length === 0 && (
                      <p className="text-center text-white/20 text-xs py-4">Belum ada pesan</p>
                    )}
                    {messages.map((msg) => {
                      const isMe = msg.senderRole === "driver";
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                            isMe ? "bg-primary text-white rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm"
                          }`}>
                            {!isMe && <p className="text-[9px] font-bold text-white/40 mb-0.5">{msg.senderName}</p>}
                            <p>{msg.message}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex gap-2 p-2 border-t border-white/10">
                    <input
                      type="text"
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMsg()}
                      placeholder="Balas customer..."
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={handleSendMsg}
                      disabled={sending || !newMsg.trim()}
                      className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-30"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
