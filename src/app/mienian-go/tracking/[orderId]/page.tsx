"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { subscribeToChatMessages, sendChatMessage, type ChatMessage } from "@/lib/firestoreGo";
import {
  Loader2, CheckCircle2, MapPin, Phone, MessageCircle,
  Send, ArrowLeft, Clock, Flame, Truck, Package, PartyPopper, X,
} from "lucide-react";
import Link from "next/link";
import { useLoadScript } from "@react-google-maps/api";

const STATUS_STEPS = [
  { key: "paid", icon: CheckCircle2, label: "Pesanan Masuk", copy: "Pesanan masuk, cuy! ✅", color: "text-green-400" },
  { key: "accepted", icon: Package, label: "Diterima Driver", copy: "KangDoMie udah ambil pesananmu!", color: "text-blue-400" },
  { key: "delivering", icon: Truck, label: "Dalam Perjalanan", copy: "KangDoMie lagi gaspol ke arahmu! 🛺", color: "text-blue-400" },
  { key: "preparing", icon: MapPin, label: "Sudah Sampai", copy: "KangDoMie udah nyampe di lokasimu! 📍", color: "text-purple-400" },
  { key: "cooking", icon: Flame, label: "Sedang Dimasak", copy: "Mie lagi direbus... sabar ya! 🔥", color: "text-orange-400" },
  { key: "delivered", icon: PartyPopper, label: "Selesai", copy: "Selamat makan! 🎉", color: "text-emerald-400" },
];

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

export default function TrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cookingSecondsLeft, setCookingSecondsLeft] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ETA States
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);
  const [etaText, setEtaText] = useState("");
  const [distanceText, setDistanceText] = useState("");
  const lastEtaFetchTime = useRef<number>(0);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // Subscribe to order
  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, "orders", orderId), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  // Subscribe to driver cooking state
  useEffect(() => {
    if (!order?.assignedDriver) return;
    const unsub = onSnapshot(doc(db, "kangdomie_drivers", order.assignedDriver), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.lat && data.lng) {
          setDriverLat(data.lat);
          setDriverLng(data.lng);
        }
        if (data.isCooking && data.cookingUntil) {
          const diffSec = Math.max(0, Math.ceil((data.cookingUntil.toMillis() - Date.now()) / 1000));
          setCookingSecondsLeft(diffSec > 0 ? diffSec : null);
        } else {
          setCookingSecondsLeft(null);
        }
      }
    });
    return () => unsub();
  }, [order?.assignedDriver]);

  // Countdown interval
  useEffect(() => {
    if (cookingSecondsLeft === null) return;
    if (cookingSecondsLeft <= 0) { setCookingSecondsLeft(null); return; }
    const timer = setInterval(() => {
      setCookingSecondsLeft(prev => {
        if (prev === null || prev <= 1) { clearInterval(timer); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cookingSecondsLeft]);

  // Subscribe to chat
  useEffect(() => {
    if (!orderId) return;
    const unsub = subscribeToChatMessages(orderId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [orderId]);

  // ETA Calculation
  useEffect(() => {
    if (!isLoaded || !window.google || !order || order.status !== "delivering" || !driverLat || !driverLng || !order.lat || !order.lng) return;

    const now = Date.now();
    // Throttle: only calculate every 60 seconds
    if (now - lastEtaFetchTime.current < 60000) return;

    lastEtaFetchTime.current = now;
    
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [{ lat: driverLat, lng: driverLng }],
        destinations: [{ lat: order.lat, lng: order.lng }],
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === "OK" && response && response.rows[0].elements[0].status === "OK") {
          const element = response.rows[0].elements[0];
          setDistanceText(element.distance.text);
          setEtaText(element.duration.text);
        }
      }
    );
  }, [isLoaded, order?.status, order?.lat, order?.lng, driverLat, driverLng]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser || sending) return;
    setSending(true);
    try {
      await sendChatMessage(orderId, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || order?.customerName || "Customer",
        senderRole: "customer",
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Send failed:", err);
    }
    setSending(false);
  };

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order?.status);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f1a] text-white px-4">
        <Package className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-bold mb-2">Pesanan tidak ditemukan</h2>
        <p className="text-white/40 text-sm mb-6">Order ID: {orderId}</p>
        <Link href="/mienian-go" className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm">
          Kembali ke Mienian GO
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/mienian-go" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="font-bold text-sm">Lacak Pesanan</p>
              <p className="text-[10px] text-white/40">#{order.orderId || orderId}</p>
            </div>
          </div>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* ========== STATUS HERO ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          {currentStepIndex >= 0 && (
            <>
              <motion.div
                key={order.status}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center ${
                  order.status === "delivered" ? "bg-emerald-500/20" :
                  order.status === "cooking" ? "bg-orange-500/20" :
                  order.status === "delivering" ? "bg-blue-500/20" :
                  "bg-primary/20"
                }`}
              >
                {(() => {
                  const Icon = STATUS_STEPS[currentStepIndex].icon;
                  return <Icon className={`w-10 h-10 ${STATUS_STEPS[currentStepIndex].color}`} />;
                })()}
              </motion.div>
              <motion.h2
                key={`copy-${order.status}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-extrabold mb-2"
              >
                {STATUS_STEPS[currentStepIndex].copy}
              </motion.h2>
            </>
          )}
          {order.status === "pending_payment" && (
            <div>
              <Clock className="w-16 h-16 text-yellow-400/50 mx-auto mb-4" />
              <h2 className="text-2xl font-extrabold mb-2">Menunggu Pembayaran ⏳</h2>
              <p className="text-white/40 text-sm">Segera selesaikan pembayaran untuk memproses pesanan</p>
            </div>
          )}

          {/* Cooking countdown */}
          {cookingSecondsLeft !== null && cookingSecondsLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/30"
            >
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="text-orange-300 text-sm font-bold">
                Masak selesai dalam{" "}
                <span className="text-orange-400 font-extrabold tabular-nums">
                  {Math.floor(cookingSecondsLeft / 60)}:{String(cookingSecondsLeft % 60).padStart(2, "0")}
                </span>
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* ========== PROGRESS STEPS ========== */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex gap-4">
                  {/* Vertical line + dot */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        backgroundColor: isActive ? (isCurrent ? "#E53935" : "#4CAF50") : "rgba(255,255,255,0.1)",
                        scale: isCurrent ? 1.2 : 1,
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        isCurrent ? "ring-4 ring-primary/20" : ""
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-white/30"}`} />
                    </motion.div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-10 ${isActive ? "bg-green-500/50" : "bg-white/10"}`} />
                    )}
                  </div>

                  {/* Label */}
                  <div className={`pt-1 pb-6 ${isActive ? "" : "opacity-30"}`}>
                    <p className={`font-bold text-sm ${isCurrent ? step.color : ""}`}>{step.label}</p>
                    {isCurrent && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-white/50 mt-0.5"
                      >
                        {step.copy}
                      </motion.p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========== ORDER DETAILS ========== */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-white/60 uppercase tracking-wider">Detail Pesanan</h3>

          <div className="space-y-2">
            {(order.items || []).map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-white/70">{item.quantity}x {item.name}</span>
                <span className="text-white/50">{formatRupiah(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Subtotal</span>
              <span className="text-white/70">{formatRupiah(order.costs?.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Ongkir</span>
              <span className={order.costs?.deliveryFee === 0 ? "text-green-400 font-bold" : "text-white/70"}>
                {order.costs?.deliveryFee === 0 ? "GRATIS" : formatRupiah(order.costs?.deliveryFee || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Layanan</span>
              <span className="text-white/70">{formatRupiah(order.costs?.serviceFee || 0)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold pt-2 border-t border-white/10">
              <span>Total</span>
              <span className="text-primary">{formatRupiah(order.costs?.grandTotal || 0)}</span>
            </div>
          </div>

          {order.address && (
            <div className="flex items-start gap-2 pt-3 border-t border-white/10">
              <MapPin className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
              <p className="text-xs text-white/50">{order.address}</p>
            </div>
          )}
        </div>

        {/* ========== DRIVER INFO ========== */}
        {(order.driverName || order.assignedDriver) && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-sm text-white/60 uppercase tracking-wider mb-3">KangDoMie-mu</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{order.driverName || "KangDoMie"}</p>
                <p className="text-xs text-white/40">
                  {order.status === "paid" && "Menunggu konfirmasi driver..."}
                  {order.status === "preparing" && "Sedang menyiapkan pesananmu"}
                  {order.status === "cooking" && "Mie lagi dimasak! 🔥"}
                  {order.status === "delivering" && "Sedang jalan ke lokasimu 🛺"}
                  {order.status === "delivered" && "Pesanan sudah diantar ✅"}
                </p>
              </div>
              {order.assignedDriver && order.status !== "delivered" && (
                <button
                  onClick={() => setChatOpen(true)}
                  className="px-4 py-2 rounded-xl bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat
                </button>
              )}
            </div>

            {/* ETA Info */}
            {order.status === "delivering" && order.address && (
              <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-300 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  KangDoMie sedang dalam perjalanan ke alamatmu
                </p>
                {etaText && distanceText && (
                  <p className="text-sm font-bold text-blue-400 pl-5">
                    🛺 Jarak: {distanceText} &bull; Estimasi: {etaText}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== CHAT PANEL ========== */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-[#0f0f1a] flex flex-col"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">Chat KangDoMie</p>
                  <p className="text-[10px] text-white/40">#{order.orderId || orderId}</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-2 rounded-xl hover:bg-white/5">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Belum ada pesan</p>
                  <p className="text-white/20 text-xs mt-1">Kirim pesan ke KangDoMie, misal: &quot;Bang, jangan pake seledri ya!&quot;</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.senderRole === "customer";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                      isMe
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white/10 text-white rounded-bl-md"
                    }`}>
                      {!isMe && (
                        <p className="text-[10px] font-bold text-white/50 mb-1">🛺 {msg.senderName}</p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? "text-white/50" : "text-white/30"}`}>
                        {msg.createdAt?.toDate?.()
                          ? new Date(msg.createdAt.toDate()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                          : "..."}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Tulis pesan..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/80 transition-colors disabled:opacity-30"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
