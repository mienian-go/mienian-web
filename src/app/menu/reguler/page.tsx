"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Flame } from "lucide-react";
import { useCart } from "@/context/CartContext";

// Dummy Data untuk Pesanan Reguler
const menuCategories = [
  {
    title: "Indomie Goreng",
    items: [
      { name: "Indomie Goreng Original", price: "Rp. 8.500" },
      { name: "Indomie Goreng Rendang", price: "Rp. 8.500" },
      { name: "Indomie Goreng Aceh", price: "Rp. 8.500" },
      { name: "Indomie Goreng Ayam Geprek", price: "Rp. 8.500" },
    ],
  },
  {
    title: "Indomie Kuah",
    items: [
      { name: "Indomie Kari", price: "Rp. 8.500" },
      { name: "Indomie Soto", price: "Rp. 8.500" },
      { name: "Indomie Ayam Bawang", price: "Rp. 8.500" },
      { name: "Indomie Ayam Spesial", price: "Rp. 8.500" },
      { name: "Indomie Seblak", price: "Rp. 8.500" },
      { name: "Indomie Banglades'e", price: "Rp. 8.500" },
      { name: "Indomie Nyemek Jogja", price: "Rp. 8.500" },
    ],
  },
  {
    title: "Topping Reguler",
    items: [
      { name: "Cheese Dumpling/pc", price: "Rp. 3.500" },
      { name: "Chicken Dumpling/pc", price: "Rp. 3.500" },
      { name: "Baso Sapi/pc", price: "Rp. 3.500" },
      { name: "Baso Ikan/pc", price: "Rp. 3.500" },
      { name: "Baso Salmon/pc", price: "Rp. 3.500" },
      { name: "Seafood Tofu/pc", price: "Rp. 3.500" },
      { name: "Fishstick/pc", price: "Rp. 3.500" },
      { name: "Chickuwa/pc", price: "Rp. 3.500" },
    ],
  },
  {
    title: "Topping Premium",
    items: [
      { name: "Odeng Original/pc", price: "Rp. 6.500" },
      { name: "Odeng Spicy/pc", price: "Rp. 6.500" },
      { name: "Telur Ceplok/pc", price: "Rp. 6.500" },
      { name: "Fish Cake/pc", price: "Rp. 6.500" },
      { name: "Kornet/pc", price: "Rp. 6.500" },
      { name: "Sosis Cocktail/pc", price: "Rp. 6.500" },
    ],
  },
  {
    title: "Topping Super",
    items: [
      { name: "Slice Beef (50gr/porsi)", price: "Rp. 11.000" },
      { name: "Grill Chicken", price: "Rp. 11.000" },
      { name: "Beef Enoki/pc", price: "Rp. 11.000" },
      { name: "Chicken Katsu", price: "Rp. 11.000" },
    ],
  },
];

export default function PesananReguler() {
  const { state, dispatch } = useCart();

  const handleAddToCart = (item: any) => {
    const hasOtherCategory = state.items.some((i) => i.category !== "reguler");
    if (hasOtherCategory) {
      alert("Pesanan Reguler tidak bisa digabungkan dengan Paket Wedding/Corporate. Silakan selesaikan pesanan sebelumnya atau kosongkan keranjang.");
      return;
    }

    const priceValue = parseInt(item.price.replace(/\D/g, ""));

    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: item.name,
        name: item.name,
        price: priceValue,
        portions: 1,
        quantity: 1,
        category: "reguler",
      },
    });
    alert(`${item.name} berhasil dimasukkan ke keranjang!`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* HEADER SECTION */}
      <div className="relative pt-32 pb-16 px-4 overflow-hidden bg-gradient-to-br from-dark-maroon to-background text-white">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-4 flex items-center gap-4">
            Pesanan <span className="text-primary">Reguler</span>
            <Flame className="w-10 h-10 text-primary animate-pulse" />
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Pilih varian Indomie favorit lo. Mix and match dengan berbagai topping pilihan dari yang reguler sampai super. Cocok banget buat nemenin hari lo!
          </p>
          
          <a href="https://wa.me/6285216706922" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 btn btn-primary">
            Masuk ke Katalog & Pesan
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* HORIZONTAL SCROLL CATALOG */}
      <div className="max-w-7xl mx-auto px-4 mt-12 space-y-16">
        {menuCategories.map((category, idx) => (
          <div key={idx}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 border-l-4 border-primary pl-4">
              {category.title}
            </h2>
            {/* Horizontal Scroll Container */}
            <div className="flex overflow-x-auto gap-4 pb-6 snap-x hide-scrollbar">
              {category.items.map((item, itemIdx) => (
                <motion.div
                  key={itemIdx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="flex-none w-[85%] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] snap-start bg-white dark:bg-card border-2 border-border/60 rounded-[20px] p-4 shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Generic Placeholder Image for Reguler (matching card style) */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center mb-4 bg-muted/60">
                    <Flame className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  
                  <div className="flex flex-col flex-1 px-1">
                    <h3 className="text-[17px] font-extrabold mb-1 text-foreground leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-muted-foreground text-[13px] leading-snug mb-5">
                      Description dan sansir, dan baoh pangsit.
                    </p>
                    <div className="mt-auto space-y-4">
                      <div className="font-extrabold text-[#C1121F] text-lg">
                        {item.price}
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="block w-full py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-center font-bold tracking-wide rounded-xl shadow-sm transition-colors"
                      >
                        PILIH
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
