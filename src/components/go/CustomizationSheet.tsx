"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, FileText, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { formatRupiah } from "@/data/menu";

interface CustomizationSheetProps {
  item: {
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
    description?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: any, quantity: number, notes: string) => void;
}

export default function CustomizationSheet({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: CustomizationSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [kematangan, setKematangan] = useState("Matang"); // Default matang

  if (!isOpen || !item) return null;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAdd = () => {
    const finalNotes = item.category === "mie" 
      ? `Kematangan: ${kematangan}${notes ? `, ${notes}` : ""}`
      : notes;
    onAddToCart(item, quantity, finalNotes);
    setQuantity(1);
    setNotes("");
    setKematangan("Matang");
    onClose();
  };

  const getCategoryImage = () => {
    if (item.imageUrl) return item.imageUrl;
    // Premium fallback images based on category
    if (item.category === "mie") return "/indomie-goreng.png";
    if (item.category?.includes("topping")) return "/topping-placeholder.png";
    return "/mienian-logo.png";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
      {/* Tap outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative bg-card w-full max-w-md rounded-t-3xl border-t border-card-border shadow-2xl overflow-hidden z-10"
      >
        {/* Drag Indicator */}
        <div className="w-12 h-1.5 bg-foreground/20 rounded-full mx-auto my-3" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground/70 hover:text-foreground transition-all"
        >
          ✕
        </button>

        <div className="px-5 pb-6 space-y-5">
          {/* Header Photo & Details */}
          <div className="flex gap-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-muted border border-card-border shrink-0">
              <img
                src={getCategoryImage()}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/mienian-logo.png";
                }}
              />
            </div>
            <div className="space-y-1">
              <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
                {item.category === "mie" ? "Noodles 🍜" : "Toppings 🍳"}
              </span>
              <h3 className="font-extrabold text-xl leading-tight">{item.name}</h3>
              <p className="text-2xl font-black text-primary">
                {formatRupiah(item.price)}
              </p>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="bg-muted/50 p-3 rounded-xl border border-card-border/55">
              <p className="text-xs text-foreground/70 leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {/* Customization Note */}
          <div className="space-y-4">
            {item.category === "mie" && (
              <div className="space-y-2 border-t border-card-border pt-4">
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/70">
                  <span>Tingkat Kematangan Mie</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setKematangan("1/2 Matang")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      kematangan === "1/2 Matang"
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted border-card-border text-foreground/70"
                    }`}
                  >
                    1/2 Matang
                  </button>
                  <button
                    onClick={() => setKematangan("Matang")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      kematangan === "Matang"
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted border-card-border text-foreground/70"
                    }`}
                  >
                    Matang
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 border-t border-card-border pt-4">
              <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/70">
                <FileText className="w-4 h-4 text-primary" />
                <span>Catatan Tambahan (Opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: kuah dipisah, tambah kecap..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border bg-muted focus:border-primary focus:outline-none text-sm transition-all focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

          {/* Quantity Controls & CTA Button */}
          <div className="flex items-center justify-between pt-3 border-t border-card-border">
            <div className="flex items-center gap-4 bg-muted px-4 py-2 rounded-2xl border border-card-border">
              <button
                onClick={handleDecrement}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-card text-foreground font-bold hover:bg-foreground/5 transition-all active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-black text-lg w-6 text-center">{quantity}</span>
              <button
                onClick={handleIncrement}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-card text-foreground font-bold hover:bg-foreground/5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              className="flex-1 ml-4 py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary/95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-98"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Tambah ke Keranjang • {formatRupiah(item.price * quantity)}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
