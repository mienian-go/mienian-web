"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";
import { useCart } from "@/context/CartContext";

// Dummy Data untuk Paket Wedding
const weddingPackages = [
  {
    id: 1,
    name: "Paket Mie Tanpa Topping",
    price: "Rp. 2.125.000",
    image: "/images/paket-wedding-1.jpg",
    desc: "Paket klasik yang difokuskan pada cita rasa otentik Indomie dengan racikan bumbu khas Mienian. Porsinya pas banget buat tamu yang suka kepraktisan tanpa repot milih topping. Kualitas rasa tetap no. 1 dengan tekstur mie yang kenyal sempurna.",
  },
  {
    id: 2,
    name: "Paket Mie 1 Topping Reguler",
    price: "Rp. 1.800.000",
    image: "/images/paket-wedding-2.jpg",
    desc: "Paket asik dengan tambahan 1 pilihan topping reguler (Baso, Sosis, atau Telur). Bikin hidangan Indomie jadi lebih bervariasi dan mengenyangkan. Pilihan favorit buat acara dengan crowd anak muda dan keluarga.",
  },
  {
    id: 3,
    name: "Paket Mie Topping Odeng",
    price: "Rp. 2.250.000",
    image: "/images/paket-wedding-3.jpg",
    desc: "Kombinasi unik Indomie dengan topping Odeng premium ala Korea. Memberikan sensasi rasa fusion Timur bertemu Asia Timur. Kuah hangat berpadu sempurna dengan kelembutan odeng yang gurih dan autentik.",
  },
  {
    id: 4,
    name: "Paket Mie Topping Komplit",
    price: "Rp. 2.200.000",
    image: "/images/paket-wedding-4.jpg",
    desc: "Pilihan paripurna buat memanjakan tamu VIP Anda! Kombinasi berbagai topping dalam satu mangkuk memberikan tekstur dan layer rasa yang kaya. Dijamin bikin tamu bolak-balik nambah lagi.",
  },
  {
    id: 5,
    name: "Paket Mie Topping Super",
    price: "Rp. 1.950.000",
    image: "/images/paket-wedding-5.jpg",
    desc: "Untuk pengalaman makan yang maksimal, paket topping super menawarkan porsi ekstra dan bahan premium (Slice Beef/Katsu). Bikin hidangan simple jadi naik level sekelas restoran bintang lima.",
  },
  {
    id: 6,
    name: "Paket Odeng",
    price: "Rp. 2.250.000",
    image: "/images/paket-wedding-6.jpg",
    desc: "Fokus pada sajian Odeng hangat dengan kaldu rahasia Mienian. Pilihan tepat sebagai stall makanan ringan peneman standing party. Sangat disukai untuk acara berkonsep outdoor atau malam hari.",
  },
];

export default function PaketWedding() {
  const { state, dispatch } = useCart();

  const handleAddToCart = (pkg: any) => {
    const hasOtherCategory = state.items.some((i) => i.category !== "wedding");
    if (hasOtherCategory) {
      alert("Paket Wedding tidak bisa digabungkan dengan Pesanan Reguler/Lainnya. Silakan selesaikan pesanan sebelumnya atau kosongkan keranjang.");
      return;
    }

    const priceValue = parseInt(pkg.price.replace(/\D/g, ""));

    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: pkg.name,
        name: pkg.name,
        price: priceValue,
        portions: 50, // default dummy portions for wedding
        quantity: 1,
        category: "wedding",
      },
    });
    alert(`${pkg.name} berhasil dimasukkan ke keranjang!`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* HEADER SECTION */}
      <div className="relative pt-32 pb-16 px-4 overflow-hidden bg-gradient-to-br from-dark-maroon to-background text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center sm:text-left">
          <Link
            href="/"
            className="inline-flex items-center justify-center sm:justify-start gap-2 text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-4 flex items-center justify-center sm:justify-start gap-4">
            Paket <span className="text-secondary">Wedding</span>
            <PartyPopper className="w-10 h-10 text-secondary animate-bounce" />
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto sm:mx-0">
            Hadirkan stall makanan paling hits di hari spesial lo. Mienian Live Cooking siap bikin tamu undangan rebutan antre buat nikmatin semangkok Indomie hangat dengan berbagai topping premium.
          </p>
        </div>
      </div>

      {/* WEDDING PACKAGES GRID */}
      <div className="max-w-7xl mx-auto px-4 mt-16 pb-12">
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x hide-scrollbar">
          {weddingPackages.map((pkg) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-none w-[85%] sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] snap-start bg-white dark:bg-card border-2 border-border/60 rounded-[20px] p-4 shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Image Container with inner radius like reference */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center mb-4 bg-muted">
                <Image
                  src={pkg.image}
                  alt={pkg.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-0 transition-opacity duration-1000"
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.classList.remove('opacity-0');
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Fallback jika gambar placeholder belum ada
                    target.style.display = 'none';
                    target.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-gradient-to-br', 'from-muted', 'to-background');
                  }}
                />
                {/* Fallback Text yang terlihat jika gambar gagal load atau sedang dimuat */}
                <div className="absolute inset-0 flex items-center justify-center text-foreground/20 font-bold text-xl pointer-events-none">
                  [ Gambar {pkg.id} ]
                </div>
              </div>

              {/* Content matching reference card */}
              <div className="flex flex-col flex-1 px-1">
                <h3 className="text-[18px] font-extrabold mb-1 text-foreground leading-tight">
                  {pkg.name}
                </h3>
                <p className="text-muted-foreground text-[14px] leading-snug mb-5 line-clamp-2">
                  {pkg.desc}
                </p>
                <div className="mt-auto space-y-4">
                  <div className="font-extrabold text-[#C1121F] text-lg">
                    {pkg.price}
                  </div>
                  <button
                    onClick={() => handleAddToCart(pkg)}
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
    </div>
  );
}
