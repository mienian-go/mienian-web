"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Check, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getMenuItems, getCateringPackages } from "@/lib/firestore";
import {
  categoryLabels,
  categoryPrices,
  formatRupiah,
} from "@/data/menu";

type Tab = "menu" | "wedding" | "corporate";

export default function CateringMenu() {
  const [activeTab, setActiveTab] = useState<Tab>("wedding");
  const { state, dispatch, totalPrice, totalItems } = useCart();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cateringPackages, setCateringPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [menus, pkgs] = await Promise.all([
          getMenuItems(true),
          getCateringPackages(true)
        ]);
        setMenuItems(menus);
        setCateringPackages(pkgs);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "menu", label: "Menu Satuan" },
    { key: "wedding", label: "Paket Wedding" },
    { key: "corporate", label: "Paket Corporate" },
  ];

  const categories = ["mie", "topping-reguler", "topping-premium", "topping-super"] as const;

  const weddingPackages = cateringPackages.filter((p) => p.category === "wedding");
  const corporatePackages = cateringPackages.filter((p) => p.category === "corporate");

  const isInCart = (id: string) => state.items.some((i) => i.id === id);

  const addPackage = (pkg: typeof cateringPackages[0]) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        portions: pkg.portions,
        quantity: 1,
        category: pkg.category,
      },
    });
  };

  return (
    <div className="flex flex-col overflow-hidden pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4">
            Katalog <span className="gradient-text">Menu & Paket</span>
          </h1>
          <p className="text-foreground/60 text-lg max-w-xl mx-auto">
            Pilih paket yang cocok buat acara lo. Semua harga udah includes live cooking setup!
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex justify-center mb-12">
          <div className="inline-flex bg-muted rounded-full p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* ===== MENU SATUAN ===== */}
          {activeTab === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {categories.map((cat) => {
                const items = menuItems.filter((m) => m.category === cat);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold">{categoryLabels[cat]}</h3>
                      <span className="text-primary font-bold text-lg">
                        {formatRupiah(categoryPrices[cat])}
                        <span className="text-foreground/40 text-sm font-normal"> / porsi</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {items.map((mi) => (
                        <div
                          key={mi.id}
                          className="card p-4 text-center group"
                        >
                          <div className="w-full h-24 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center mb-3">
                            <span className="text-3xl group-hover:scale-110 transition-transform">
                              {cat === "mie" ? "🍜" : cat === "topping-reguler" ? "🥟" : cat === "topping-premium" ? "🍢" : "🍗"}
                            </span>
                          </div>
                          <p className="text-sm font-semibold leading-tight">{mi.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="card p-8 text-center bg-gradient-to-r from-secondary/10 to-accent">
                <p className="text-foreground/60 mb-4">
                  Menu satuan tersedia sebagai pilihan di setiap paket catering. Untuk memesan, pilih paket di tab <strong>Paket Wedding</strong>.
                </p>
                <button
                  onClick={() => setActiveTab("wedding")}
                  className="btn btn-primary btn-md"
                >
                  Lihat Paket Wedding
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== PAKET WEDDING ===== */}
          {activeTab === "wedding" && (
            <motion.div
              key="wedding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {weddingPackages.map((pkg, i) => {
                  const inCart = isInCart(pkg.id);
                  return (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`card p-6 sm:p-8 flex flex-col justify-between ${
                        inCart ? "border-tertiary/40 bg-tertiary/5" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl font-bold">{pkg.name}</h3>
                          <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold whitespace-nowrap">
                            {pkg.portions} Porsi
                          </span>
                        </div>
                        <p className="text-foreground/50 text-sm mb-6 leading-relaxed">
                          {pkg.description}
                        </p>
                        <p className="text-3xl font-extrabold text-primary mb-6">
                          {formatRupiah(pkg.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => !inCart && addPackage(pkg)}
                        disabled={inCart}
                        className={`btn btn-md w-full ${
                          inCart
                            ? "bg-tertiary/10 text-tertiary cursor-default"
                            : "btn-primary"
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-4 h-4" /> Udah di Keranjang
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Pilih Paket
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ===== PAKET CORPORATE ===== */}
          {activeTab === "corporate" && (
            <motion.div
              key="corporate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="card max-w-lg mx-auto p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-transparent" />
                <div className="relative z-10">
                  <Lock className="w-16 h-16 text-foreground/20 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-3">Coming Soon! 🚀</h3>
                  <p className="text-foreground/50 mb-6 leading-relaxed">
                    Paket Corporate Event lagi kita racik biar makin mantap. Stay tuned dan follow socmed kita buat update terbaru!
                  </p>
                  <a
                    href="https://wa.me/6285216706922"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outlined btn-md"
                  >
                    Tanya via WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}
      </div>

      {/* ============ FLOATING CART BAR ============ */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-glass-border shadow-2xl shadow-black/10"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground/50">{totalItems} paket dipilih</p>
                  <p className="text-xl font-extrabold text-primary">{formatRupiah(totalPrice)}</p>
                </div>
              </div>
              <Link href="/catering/cart" className="btn btn-primary btn-md">
                Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
