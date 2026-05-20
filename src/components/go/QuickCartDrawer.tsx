"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";
import { useGoCart } from "@/context/GoCartContext";
import { formatRupiah } from "@/data/menu";
import { useRouter } from "next/navigation";

interface QuickCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SERVICE_FEE = 3000;

export default function QuickCartDrawer({ isOpen, onClose }: QuickCartDrawerProps) {
  const { state, dispatch, totalPrice, totalItems } = useGoCart();
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpdateQuantity = (id: string, currentQty: number, change: number) => {
    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { id, quantity: currentQty + change },
    });
  };

  const handleRemoveItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id });
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    dispatch({ type: "SET_NOTES", payload: { id, notes } });
  };

  const handleCheckoutRedirect = () => {
    onClose();
    router.push("/mienian-go/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
      {/* Tap backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative bg-card w-full max-w-md rounded-t-3xl border-t border-card-border shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
      >
        {/* Drag Indicator */}
        <div className="w-12 h-1.5 bg-foreground/20 rounded-full mx-auto my-3 shrink-0" />

        {/* Title Block */}
        <div className="px-5 pb-3 flex items-center justify-between border-b border-card-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-lg">Keranjang Belanja</h3>
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-black">
              {totalItems}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground/70 hover:text-foreground transition-all"
          >
            ✕
          </button>
        </div>

        {/* Items List (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {state.items.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <span className="text-4xl">🛒</span>
              <p className="font-bold text-foreground/60">Keranjang masih kosong nih</p>
              <p className="text-xs text-foreground/40">Yuk pilih Indomie andalanmu dulu!</p>
            </div>
          ) : (
            state.items.map((item) => (
              <div
                key={item.id}
                className="bg-muted/40 p-3 rounded-2xl border border-card-border/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground leading-tight">
                      {item.name}
                    </h4>
                    <p className="text-xs text-primary font-black mt-1">
                      {formatRupiah(item.price)}
                    </p>
                  </div>
                  
                  {/* Quantity Actions */}
                  <div className="flex items-center gap-2.5 bg-card border border-card-border px-2 py-1 rounded-xl">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                      className="text-foreground/75 hover:text-primary transition-colors p-0.5"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-xs w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                      className="text-foreground/75 hover:text-primary transition-colors p-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notes box */}
                <div className="flex items-center gap-2 bg-card/65 px-2.5 py-1.5 rounded-lg border border-card-border/40">
                  <MessageSquare className="w-3 h-3 text-primary shrink-0" />
                  <input
                    type="text"
                    placeholder="Tambah catatan..."
                    value={item.notes || ""}
                    onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                    className="bg-transparent border-none outline-none text-[11px] text-foreground/80 placeholder-foreground/45 w-full focus:ring-0 focus:outline-none"
                  />
                  {item.quantity > 0 && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500/80 hover:text-red-500 shrink-0 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Block (Fees & Checkout) */}
        {state.items.length > 0 && (
          <div className="border-t border-card-border bg-card p-5 space-y-4 shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
            {/* Courier status banner */}
            {state.driverId ? (
              <div className="flex items-center gap-2 bg-green-500/5 border border-green-500/15 p-2.5 rounded-xl text-[11px] text-green-400">
                <span className="animate-pulse w-2 h-2 rounded-full bg-green-400" />
                <span>Memesan via kurir: <strong>{state.driverName}</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/15 p-2.5 rounded-xl text-[11px] text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Kamu belum memilih KangDoMie di peta! Silakan pilih driver dulu.</span>
              </div>
            )}

            {/* Calculations */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-foreground/60">
                <span>Subtotal Makanan</span>
                <span>{formatRupiah(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-foreground/60">
                <span>Biaya Layanan</span>
                <span>{formatRupiah(SERVICE_FEE)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-foreground pt-1.5 border-t border-card-border/50">
                <span>Total Pembayaran</span>
                <span className="text-primary">{formatRupiah(totalPrice + SERVICE_FEE)}</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleCheckoutRedirect}
              disabled={!state.driverId}
              className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>Lanjut ke Pembayaran</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
