"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDriver, type KangDoMieDriver } from "@/lib/firestoreDriver";
import { recordSale, calculateCommission, decrementDriverStock } from "@/lib/firestoreDriverSales";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/kangdomie/BottomNav";
import Image from "next/image";
import {
  Loader2, Plus, Minus, Trash2, ShoppingCart, Check, X,
  DollarSign, Award, ChevronDown, QrCode, Camera, ScanLine
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock?: number;
  isActive: boolean;
}

interface CartItem extends MenuItem {
  qty: number;
}

export default function KangDoMiePOS() {
  const router = useRouter();
  const [driver, setDriver] = useState<KangDoMieDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [driverInventory, setDriverInventory] = useState<Record<string, number>>({});
  
  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUserId, setScannedUserId] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/kangdomie/login"); return; }
      const d = await getDriver(user.uid);
      if (!d || !d.isApproved) { router.push("/kangdomie/login"); return; }
      setDriver(d);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // Subscribe to menu items
  useEffect(() => {
    const q = query(collection(db, "menu_items"), orderBy("sortOrder", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as MenuItem))
        .filter((item) => item.isActive);
      setMenuItems(items);
    });
    return () => unsub();
  }, []);

  // Subscribe to driver's inventory (real-time)
  useEffect(() => {
    if (!driver) return;
    const unsub = onSnapshot(doc(db, "kangdomie_drivers", driver.uid), (snap) => {
      if (snap.exists()) {
        setDriverInventory(snap.data().inventory || {});
      }
    });
    return () => unsub();
  }, [driver?.uid]);

  const categories = [
    { id: "all", label: "Semua" },
    ...Array.from(new Set(menuItems.map((m) => m.category))).map((c) => ({
      id: c,
      label: c === "mie" ? "🍜 Mie" : c === "topping-reguler" ? "🥚 Reguler" : c === "topping-premium" ? "🥩 Premium" : c,
    })),
  ];

  const filteredMenu = activeCategory === "all" ? menuItems : menuItems.filter((m) => m.category === activeCategory);

  const addToCart = (item: MenuItem) => {
    const existing = cart.find((c) => c.id === item.id);
    const myStock = driverInventory[item.id];
    if (existing) {
      if (myStock !== undefined && existing.qty >= myStock) return;
      setCart(cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(
      cart
        .map((c) => {
          if (c.id !== id) return c;
          const newQty = c.qty + delta;
          const myStock = driverInventory[c.id];
          if (myStock !== undefined && newQty > myStock) return c;
          return { ...c, qty: newQty };
        })
        .filter((c) => c.qty > 0)
    );
  };

  const totalAmount = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const commission = calculateCommission(totalAmount);
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  const handleCheckout = async () => {
    if (!driver || cart.length === 0) return;
    setProcessing(true);
    try {
      // Record sale
      await recordSale({
        driverId: driver.uid,
        driverName: driver.name,
        items: cart.map((c) => ({ id: c.id, name: c.name, qty: c.qty, price: c.price })),
        totalAmount,
        saleType: "pos",
      });

      // Decrement driver's inventory for each item
      for (const item of cart) {
        await decrementDriverStock(driver.uid, item.id, item.qty);
      }

      // Calculate cooking time (only count "mie" category for portions)
      const miePortions = cart.filter(c => c.category === "mie").reduce((sum, c) => sum + c.qty, 0);
      
      if (miePortions > 0) {
        // 1-4 portions = 4 min, 5-8 = 8 min, etc.
        const cookingMinutes = Math.ceil(miePortions / 4) * 4;
        // Start countdown 30 seconds after payment
        const delayMs = 30000;
        const cookingMs = cookingMinutes * 60000;
        const cookingUntil = Timestamp.fromMillis(Date.now() + delayMs + cookingMs);

        await updateDoc(doc(db, "kangdomie_drivers", driver.uid), {
          isCooking: true,
          cookingUntil,
          updatedAt: Timestamp.now(),
        });
      }

      // If a customer was scanned, give them points
      if (scannedUserId) {
        try {
          const { earnPoints } = await import("@/lib/firestoreGo");
          await earnPoints(scannedUserId, totalAmount, `Walk-in`);
        } catch (pointErr) {
          console.error("Failed to add points to customer:", pointErr);
        }
      }

      setCart([]);
      setShowCart(false);
      setScannedUserId(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Checkout failed:", err);
    }
    setProcessing(false);
  };

  // QR Scanner logic
  const startScanner = async () => {
    setShowScanner(true);
    setScannedUserId(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("pos-qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await scanner.stop();
          scannerRef.current = null;
          setShowScanner(false);
          setScannedUserId(decodedText);
        },
        () => {} // ignore errors
      );
    } catch (err) {
      console.error("Scanner error:", err);
      alert("Tidak bisa mengakses kamera.");
      setShowScanner(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
    }
    setShowScanner(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-extrabold text-lg">POS System</h1>
              <p className="text-[10px] text-white/40">Transaksi Langsung — {driver?.gerobakId}</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2.5 rounded-xl bg-primary/10 text-primary"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Grid - Grouped by Category */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {[
          { id: "mie", label: "🍜 Mie", emoji: "🍜" },
          { id: "topping-reguler", label: "🥚 Topping Reguler", emoji: "🥚" },
          { id: "topping-premium", label: "🥩 Topping Premium", emoji: "🥩" },
          { id: "topping-super", label: "⭐ Topping Super", emoji: "⭐" },
        ]
          .filter((cat) => {
            const items = filteredMenu.filter((m) => m.category === cat.id);
            return items.length > 0;
          })
          .map((cat) => {
            const items = filteredMenu.filter((m) => m.category === cat.id);
            return (
              <div key={cat.id}>
                <h3 className="text-sm font-extrabold text-white/60 uppercase tracking-wider mb-3 px-1">
                  {cat.label}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item) => {
                    const inCart = cart.find((c) => c.id === item.id);
                    const myStock = driverInventory[item.id];
                    const outOfStock = myStock !== undefined && myStock <= 0;

                    return (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => !outOfStock && addToCart(item)}
                        disabled={outOfStock}
                        className={`relative text-left rounded-2xl border p-3 transition-all ${
                          inCart
                            ? "border-primary/40 bg-primary/5"
                            : outOfStock
                            ? "border-white/5 bg-white/[0.02] opacity-50"
                            : "border-white/5 bg-white/[0.03] hover:border-white/10"
                        }`}
                      >
                        {item.imageUrl && (
                          <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 bg-white/5">
                            <Image src={item.imageUrl} alt={item.name} width={200} height={200} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <p className="font-bold text-xs leading-tight mb-1">{item.name}</p>
                        <p className="text-primary font-extrabold text-sm">{formatRupiah(item.price)}</p>

                        {myStock !== undefined && (
                          <p className={`text-[9px] mt-1 font-bold ${myStock <= 3 ? "text-red-400" : "text-white/30"}`}>
                            Stok: {myStock}
                          </p>
                        )}

                        {inCart && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                            {inCart.qty}
                          </div>
                        )}

                        {outOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                            <span className="text-xs font-bold text-red-400">Habis</span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Floating total bar */}
      {totalItems > 0 && !showCart && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-24 left-4 right-4 z-40 max-w-2xl mx-auto"
        >
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-primary shadow-2xl shadow-primary/30"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-bold text-sm">{totalItems} item</span>
            </div>
            <span className="font-extrabold">{formatRupiah(totalAmount)}</span>
          </button>
        </motion.div>
      )}

      {/* Cart Sheet */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#1a1a2e] rounded-t-3xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-extrabold text-lg">Keranjang</h2>
                <button onClick={() => setShowCart(false)} className="p-2 rounded-xl hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-white/30 py-8 text-sm">Keranjang kosong</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-primary font-bold">{formatRupiah(item.price * item.qty)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 pb-24 border-t border-white/10 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Total</span>
                    <span className="font-extrabold text-lg">{formatRupiah(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50 flex items-center gap-1"><Award className="w-3 h-3 text-yellow-400" /> Komisi</span>
                    <span className="font-bold text-yellow-400">+{formatRupiah(commission)}</span>
                  </div>
                  
                  {/* Scan Pelanggan untuk Poin Mienian Power */}
                  <div className="pt-3 border-t border-white/10 mt-3">
                    <p className="text-xs text-white/50 mb-2 font-bold text-center">Mienian Power Pelanggan</p>
                    {scannedUserId ? (
                      <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          <div className="text-xs">
                            <p className="font-bold text-primary">Member Discan!</p>
                            <p className="text-white/60">UID: {scannedUserId.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <button onClick={() => setScannedUserId(null)} className="text-xs text-white/50 hover:text-white">Batal</button>
                      </div>
                    ) : (
                      <button
                        onClick={startScanner}
                        className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/60 text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                      >
                        <ScanLine className="w-4 h-4" />
                        Scan QR Profil Pelanggan
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-[#FF6B6B] font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Bayar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white text-lg">Scan QR Pelanggan</h3>
                <button onClick={stopScanner} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-black rounded-3xl overflow-hidden border-2 border-primary/50 aspect-square relative shadow-2xl shadow-primary/20">
                <div id="pos-qr-reader" className="w-full h-full" />
                
                {/* Scanning overlay UI */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary/50 rounded-xl relative">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-white/50 mt-6">
                Arahkan kamera ke QR E-Card yang ada di web pelanggan (Tombol "QR Member" di profil).
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success toast */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-xl">
              <Check className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-bold text-sm text-emerald-400">Transaksi Berhasil!</p>
                <p className="text-xs text-white/50">Komisi +{formatRupiah(commission)} telah ditambahkan</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
