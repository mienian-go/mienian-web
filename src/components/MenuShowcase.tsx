"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface MenuCardProps {
  title: string;
  desc: string;
  image: string;
  href?: string;
  isComingSoon?: boolean;
  price?: string;
}

const MenuCard = ({ title, desc, image, href, isComingSoon, price }: MenuCardProps) => {
  const CardContent = (
    <div className="relative w-[280px] sm:w-[320px] h-[400px] rounded-3xl overflow-hidden group shrink-0 cursor-pointer">
      {/* Background Image */}
      <Image 
        src={image} 
        alt={title} 
        fill 
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      
      {/* Badges */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {isComingSoon && (
          <span className="px-3 py-1 rounded-full bg-secondary text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
            Coming Soon
          </span>
        )}
        {price && (
          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20">
            {price}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-xl font-black mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-white/70 line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {desc}
        </p>
        
        {!isComingSoon && (
          <div className="flex items-center gap-2 text-primary text-sm font-bold">
            <span>Lihat Detail</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );

  if (isComingSoon || !href) {
    return CardContent;
  }

  return <Link href={href}>{CardContent}</Link>;
};

const menuItems = [
  {
    title: "Paket Wedding",
    desc: "Live cooking katering spesial untuk hari bahagia kamu. Pilihan lengkap & mewah.",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800",
    href: "/menu/wedding",
    price: "Mulai dari Rp 4jt"
  },
  {
    title: "Paket Gathering",
    desc: "Paket katering asik buat kantoran, ultah, atau arisan. Segera hadir!",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    isComingSoon: true
  },
  {
    title: "Varian Mie",
    desc: "Mie Aceh, Mie Goreng, Mie Kuah — semua dimasak fresh dengan bumbu rahasia.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=800",
    href: "/menu/reguler",
    price: "Rp 15rb"
  },
  {
    title: "Topping Reguler",
    desc: "Sawi, Telur, Kerupuk — pelengkap klasik yang bikin makan makin mantap.",
    image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=800",
    href: "/menu/reguler",
    price: "+ Rp 3rb"
  },
  {
    title: "Topping Premium",
    desc: "Bakso, Sosis, Odeng — buat kamu yang mau naik level kelezatannya.",
    image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=800",
    href: "/menu/reguler",
    price: "+ Rp 5rb"
  },
  {
    title: "Topping Super",
    desc: "Chicken Katsu, Beef Slice, Dimsum — kasta tertinggi Indomie live cooking.",
    image: "https://images.unsplash.com/photo-1606331107770-ee6040a3595e?auto=format&fit=crop&q=80&w=800",
    href: "/menu/reguler",
    price: "+ Rp 8rb"
  }
];

export function MenuShowcase() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
              INTIP <span className="text-primary">MENUNYA</span> 🔥
            </h2>
            <p className="text-foreground/50 max-w-md">
              Dari paket mewah sampai topping receh tapi bikin nagih. Geser buat liat pilihan favorit lo!
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-foreground/40"
          >
            <span>Geser Kanan</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
            </div>
          </motion.div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-auto no-scrollbar pb-8 pt-4">
          <div className="flex gap-6 px-4 sm:px-6 lg:px-8">
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <MenuCard {...item} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
