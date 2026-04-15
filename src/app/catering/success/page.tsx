"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useBooking } from "@/context/BookingContext";
import { Home, MessageCircle, Copy, Check, PartyPopper } from "lucide-react";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const colors = ["#C8102E", "#FFB300", "#2E7D32", "#FF6B6B", "#FFD54F", "#66BB6A", "#FF8A80"];
    const newPieces: ConfettiPiece[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 6 + Math.random() * 10,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -20, x: `${piece.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: 720 }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "linear" }}
          style={{
            position: "absolute",
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

export default function SuccessPage() {
  const { dispatch: dispatchCart } = useCart();
  const { state: stateBooking, dispatch: dispatchBooking } = useBooking();
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [showConfetti, setShowConfetti] = useState(true);

  const initializePage = useCallback(() => {
    // Attempt to read from URL param passed by ConfirmPage
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const urlOrderId = searchParams?.get("orderId");
    
    if (urlOrderId) {
      setOrderId(urlOrderId);
    } else {
      const num = Math.floor(Math.random() * 999) + 1;
      setOrderId(`#MIENIAN-EVNT${String(num).padStart(3, "0")}`);
    }
  }, []);

  useEffect(() => {
    initializePage();
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [initializePage]);

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoHome = () => {
    dispatchCart({ type: "CLEAR_CART" });
    dispatchBooking({ type: "RESET_WIZARD" });
  };

  const generateWA = () => {
    if (!stateBooking.name) return "https://wa.me/6285216706922"; // Fallback if refreshed
    
    const c = stateBooking.calculations;
    const pesan = `Halo Mienian Catering ✨\nSaya sudah input dan upload pembayaran di web dengan detail berikut:\n\n▪️ Order ID: ${orderId}\n▪️ Nama: ${stateBooking.name}\n▪️ Acara: ${stateBooking.eventType}\n▪️ Tanggal: ${stateBooking.date}\n▪️ Jam: ${stateBooking.time}\n\nTotal Tagihan: Rp ${c.grandTotal.toLocaleString("id-ID")}\nSistem Bayar: ${stateBooking.paymentType === "dp" ? "DP 50%" : "Full Payment"}\n\nMohon diverifikasi. Terima kasih!`;
    return `https://wa.me/6285216706922?text=${encodeURIComponent(pesan)}`;
  };

  return (
    <>
      {showConfetti && <Confetti />}

      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="max-w-lg w-full text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto mb-8"
          >
            <PartyPopper className="w-12 h-12 text-tertiary" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl font-extrabold mb-4"
          >
            Payment Secured!
            <br />
            Lo Tinggal Duduk Manis. 🎉
          </motion.h1>

          {/* Order ID */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6 mb-6 inline-block"
          >
            <p className="text-foreground/50 text-xs mb-1">Order ID Lo:</p>
            <div className="flex items-center gap-3 justify-center">
              <p className="text-2xl font-extrabold font-mono text-primary tracking-wider">{orderId}</p>
              <button
                type="button"
                onClick={handleCopyOrderId}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  copied
                    ? "bg-tertiary/10 text-tertiary"
                    : "bg-muted text-foreground/50 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-foreground/40 text-xs mt-2">(Simpen buat jaga-jaga ya)</p>
          </motion.div>

          {/* Body */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <p className="text-foreground/60 leading-relaxed mb-4">
              Asik, orderan catering lo udah masuk antrean sistem kita! Kru Mienian bakal segera prepare semuanya.
              Invoice resmi dan detail briefing bakal otomatis meluncur ke WhatsApp lo sebentar lagi. 📲
            </p>
            <p className="text-foreground/50 text-sm">
              Sampai ketemu di venue, siap-siap tamu lo pada nambah makan! 😋🔥
            </p>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/" onClick={handleGoHome} className="btn btn-primary btn-lg">
              <Home className="w-5 h-5" />
              Balik ke Beranda
            </Link>
            <a
              href={generateWA()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outlined btn-md"
            >
              <MessageCircle className="w-5 h-5" />
              Chat Admin WA
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-foreground/30 text-xs mt-8"
          >
            Kalau ada yang kelupaan, langsung chat admin ya. Kita fast response kok! 😎
          </motion.p>
        </motion.div>
      </div>
    </>
  );
}
