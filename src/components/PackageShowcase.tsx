"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cateringPackages, formatRupiah } from "@/data/menu";

interface PackageCardProps {
  title: string;
  price: number;
  portions: number;
  image: string;
  href?: string;
  isComingSoon?: boolean;
}

const PackageCard = ({ title, price, portions, image, href, isComingSoon }: PackageCardProps) => {
  const CardContent = (
    <div className="relative w-[280px] sm:w-[320px] bg-white rounded-[24px] overflow-hidden shadow-xl shadow-black/10 border border-black/5 flex flex-col group shrink-0 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
      {/* Image Area — the pre-designed image fills this */}
      <div className="relative w-full aspect-[4/5] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {isComingSoon && (
          <div className="absolute top-4 right-4 bg-secondary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse z-20">
            Coming Soon
          </div>
        )}
      </div>

      {/* Bottom Footer — Name + Price */}
      <div className="p-5 bg-white">
        <div className="text-sm font-bold text-foreground mb-1 leading-snug">
          {title}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-black text-secondary">{formatRupiah(price)}</span>
          <span className="text-[11px] font-semibold text-foreground/35">/ {portions} porsi</span>
        </div>
      </div>

      {/* CTA Overlay on hover */}
      {!isComingSoon && (
        <div className="absolute inset-0 bg-primary/95 flex flex-col items-center justify-center p-8 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 rounded-[24px]">
          <div className="w-16 h-16 rounded-full bg-white/20 mb-4 flex items-center justify-center">
            <ChevronRight className="w-8 h-8 text-white" />
          </div>
          <p className="text-white font-bold text-lg mb-2">Pilih Paket Ini?</p>
          <p className="text-white/70 text-xs mb-6">Tap buat lanjut ke detail pesanan</p>
          <div className="w-full py-3 bg-white text-primary font-black rounded-2xl text-center">
            Sikat Sekarang!
          </div>
        </div>
      )}
    </div>
  );

  if (isComingSoon || !href) return CardContent;
  return <Link href={href}>{CardContent}</Link>;
};

export function PackageShowcase() {
  const weddingPkgs = cateringPackages.filter(p => p.category === "wedding");

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Paket Wedding</h2>
            </div>
            <p className="text-foreground/50 max-w-lg">
              Temukan paket yang paling cocok buat acara lo. Geser ke kanan buat liat pilihan lainnya!
            </p>
          </motion.div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-auto no-scrollbar pb-12 pt-4">
          <div className="flex gap-6 px-4 sm:px-6 lg:px-8">
            {weddingPkgs.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <PackageCard
                  title={pkg.name}
                  price={pkg.price}
                  portions={pkg.portions}
                  image={pkg.image || `/images/paket-wedding-${index + 1}.jpg`}
                  href="/menu/wedding"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
