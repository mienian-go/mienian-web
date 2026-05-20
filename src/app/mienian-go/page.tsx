"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  MapPin, 
  ShoppingCart, 
  Menu as MenuIcon,
  Home,
  Bike,
  QrCode,
  Store,
  User,
  ChevronRight,
  Info,
  Loader2,
  Gift,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/data/menu";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { updateUserProfile, getUserProfile, getOrdersByUserId } from "@/lib/firestore";
import { subscribeToKangDoMieLocations, subscribeToUserPoints } from "@/lib/firestoreGo";
import { useGoCart } from "@/context/GoCartContext";
import { useAuth } from "@/context/AuthContext";
import NearbyKangDoMieMap from "@/components/NearbyKangDoMieMap";
import CustomizationSheet from "@/components/go/CustomizationSheet";
import QuickCartDrawer from "@/components/go/QuickCartDrawer";
import BottomNavigation from "@/components/BottomNavigation";

const scheduleData = [
  { day: "Senin - Rabu", area: "Jakarta — Tebet & Sudirman", time: "16:00 - 22:00" },
  { day: "Kamis - Jumat", area: "Jakarta — Menteng & Kemang", time: "17:00 - 23:00" },
  { day: "Sabtu - Minggu", area: "Bandung — Dago, Braga, Pasteur", time: "15:00 - 23:00" },
];

export default function MienianGO() {
  const { state, dispatch, totalItems, totalPrice } = useGoCart();
  const { user, logout } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"menu" | "go" | "qr" | "stall" | "akun">("menu");
  const [selectedCustomItem, setSelectedCustomItem] = useState<any | null>(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Profile Loyalty State
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState(0);

  // Auth Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Data States
  const [dbMenuItems, setDbMenuItems] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [availableKangCount, setAvailableKangCount] = useState(0);
  const [rawLocations, setRawLocations] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([
    { id: 1, image: "/images/promo_slide_1.png" },
    { id: 2, image: "/images/promo_slide_2.png" },
    { id: 3, image: "/images/promo_slide_3.png" },
    { id: 4, image: "/images/promo_slide_4.png" }
  ]);
  const [showNoKangDoMieModal, setShowNoKangDoMieModal] = useState(false);
  const [userAddress, setUserAddress] = useState("Mencari lokasi...");

  // Get user location + reverse geocode address
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, lng } = { latitude: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBgj6aPrkcd-B2lWsE0_AdA8PQpbO13R7c";
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${lng}&key=${apiKey}&language=id`
          );
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setUserAddress(data.results[0].formatted_address);
          }
        } catch (err) {
          console.error("Reverse geocode error:", err);
          setUserAddress("Lokasi tidak diketahui");
        }
      },
      () => {
        setUserAddress("Izin lokasi ditolak");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch Menu catalog
  useEffect(() => {
    async function fetchMenu() {
      try {
        const q = query(collection(db, "menu_items"), orderBy("sortOrder", "asc"));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((item: any) => item.isActive);
        setDbMenuItems(items);
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setIsLoadingMenu(false);
      }
    }
    fetchMenu();
  }, []);

  // Fetch Active Locations
  useEffect(() => {
    const unsub = subscribeToKangDoMieLocations((locations) => {
      setRawLocations(locations);
    });
    return () => unsub();
  }, []);

  // Track Online Drivers & Auto-Verify selected driver status
  useEffect(() => {
    const updateCountAndVerifyDriver = () => {
      const now = Date.now();
      const activeDrivers = rawLocations.filter((k) => {
        if (k.status !== "available") return false;
        if (!k.lastUpdated) return false;
        try {
          const diff = now - k.lastUpdated.toMillis();
          return diff <= 45000; // 45 seconds buffer
        } catch { return false; }
      });
      setAvailableKangCount(activeDrivers.length);

      // Verify currently selected driver is still active/online
      if (state.driverId) {
        const isCurrentDriverActive = activeDrivers.some((d) => d.id === state.driverId);
        if (!isCurrentDriverActive) {
          dispatch({
            type: "SET_DELIVERY_DETAILS",
            payload: { driverId: undefined, driverName: undefined }
          });
        }
      }
    };
    updateCountAndVerifyDriver();
    const interval = setInterval(updateCountAndVerifyDriver, 5000);
    return () => clearInterval(interval);
  }, [rawLocations, state.driverId, dispatch]);

  // Subscribe to loyalty points and fetch order history on user change
  useEffect(() => {
    if (!user) {
      setOrderHistory([]);
      setUserPoints(0);
      return;
    }

    const uid = user.uid;

    const unsubPoints = subscribeToUserPoints(uid, (data) => {
      setUserPoints(data?.points || 0);
    });

    async function fetchHistory() {
      try {
        const history = await getOrdersByUserId(uid);
        setOrderHistory(history);
      } catch (e) {
        console.error("Order history fetch error:", e);
      }
    }
    fetchHistory();

    return () => unsubPoints();
  }, [user]);

  // Fetch Promos
  useEffect(() => {
    async function fetchPromos() {
      try {
        const q = query(collection(db, "promos"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const promoItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const validPromos = promoItems.filter((p: any) => p.image && typeof p.image === 'string' && p.image.length > 5);
          if (validPromos.length > 0) {
            setPromos(validPromos);
          }
        }
      } catch (error) {
        console.error("Error fetching promos, using fallback:", error);
      }
    }
    fetchPromos();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmittingAuth(true);
    try {
      if (isLoginMode) {
        const userCredential = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        const userProfile = await getUserProfile(userCredential.user.uid);
        if (!userProfile) {
          await auth.signOut();
          setAuthError("Email ini terdaftar sebagai Affiliate/Admin. Silakan gunakan email pembeli biasa.");
          setIsSubmittingAuth(false);
          return;
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await updateUserProfile(userCredential.user.uid, {
          email: authEmail,
          name: authEmail.split("@")[0],
          whatsapp: "",
        });
      }
      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Gagal Autentikasi");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleAddToCart = (item: any, quantity: number, notes: string) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity,
        category: item.category,
        notes: notes || undefined,
      }
    });
  };

  const getItemQuantity = (id: string) => {
    return state.items.find((i) => i.id === id)?.quantity || 0;
  };

  const categoriesToShow = [
    { id: "mie", title: "Pilihan Mie", emoji: "🍜" },
    { id: "topping-reguler", title: "Pilihan Topping Reguler", emoji: "🥚" },
    { id: "topping-premium", title: "Pilihan Topping Premium", emoji: "🥩" },
  ];

  const displayName = user?.email?.split("@")[0] || null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] pb-24 relative overflow-x-hidden">
      
      {/* ============ GREEN HEADER AREA ============ */}
      <div className="relative bg-gradient-to-r from-[#006837] to-[#8CC63F] pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-[2rem]">
        {/* Decorative background shapes */}
        <div className="absolute inset-0 opacity-10">
           <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0,100 L100,0 L100,100 Z" fill="white" />
           </svg>
        </div>

        <div className="relative z-10 max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-11 h-11 flex items-center justify-center drop-shadow-md shrink-0">
               <Image src="/images/mienian-logo-new.png" alt="Mienian" width={44} height={44} className="object-contain" />
             </div>
             <div className="flex flex-col justify-center">
               {user ? (
                 <>
                   <h1 className="text-white text-[13px] font-semibold opacity-90">Halo, {displayName}</h1>
                   <p className="text-white text-[15px] font-black tracking-tight leading-tight max-w-[200px]">
                     Mau makan mie pakai topping apa hari ini?
                   </p>
                 </>
               ) : (
                 <h1 className="text-white text-[17px] font-black tracking-tight leading-tight max-w-[180px]">
                   Mau makan mie pakai topping apa hari ini?
                 </h1>
               )}
             </div>
          </div>
          <button onClick={() => setShowCartDrawer(true)} className="relative p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors shrink-0">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============ MIENIACS LOYALTY CARD (OVERLAPPING) ============ */}
      <div className="max-w-md mx-auto px-4 w-full -mt-16 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider mb-0.5">MIENIACS</p>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                  <span className="text-[10px]">⚡</span>
                </div>
                <span className="text-xl font-black">{userPoints.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex items-center w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (userPoints / 1000) * 100)}%` }}></div>
               </div>
               <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                 🍜 x2 Gratis
               </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 border border-gray-200 rounded-xl p-2.5 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center text-primary">
                 <QrCode className="w-4 h-4" />
              </div>
              <div className="text-left leading-none">
                <span className="block font-black text-[11px]">KLAIM</span>
                <span className="text-[9px] text-gray-500">Buka QR</span>
              </div>
            </button>
            <button className="flex-1 bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 flex items-center justify-between hover:bg-blue-50 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                   <Gift className="w-4 h-4" />
                </div>
                <div className="text-left leading-none">
                  <span className="block font-black text-[11px] text-blue-700">REDEEM</span>
                  <span className="text-[9px] text-blue-600/70">1 Poin = Rp 1</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ============ MAIN CONTENT AREA ============ */}
      <main className="flex-1 mt-6 px-4 max-w-md mx-auto w-full space-y-6">
        
        {activeTab === "menu" ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* MAP SECTION CARD */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-[#1C1C1E] px-4 py-3 flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-semibold truncate">{userAddress}</span>
              </div>
              <div className="h-80 mb-4 relative bg-gray-100">
                 <NearbyKangDoMieMap onStartOrder={() => setActiveTab("menu")} hideTitle={true} />
              </div>
              {/* Conditional Banner based on driver availability */}
              {availableKangCount > 0 ? (
                <div className="bg-green-50 px-4 py-3 flex items-center justify-between border-b border-green-100">
                   <span className="text-xs font-black text-green-600">✅ {availableKangCount} KangDoMie siap di areamu!</span>
                   <button 
                     onClick={() => document.getElementById("menu-catalog-section")?.scrollIntoView({ behavior: "smooth" })}
                     className="text-[10px] text-green-700 font-bold hover:text-green-900"
                   >
                     Pesan sekarang &gt;
                   </button>
                </div>
              ) : (
                <div className="bg-[#FFEBEE] px-4 py-3 flex items-center justify-between border-b border-red-100">
                   <span className="text-xs font-black text-[#C8102E]">Gak ada KangDoMie di areamu :(</span>
                   <button onClick={() => setShowNoKangDoMieModal(true)} className="text-[10px] text-gray-600 font-semibold hover:text-black">
                     Baca lebih &gt;
                   </button>
                </div>
              )}
              {/* Delivery CTA */}
              <div className="p-4 flex gap-3">
                 <div className="w-20 shrink-0">
                    <div className="aspect-[3/4] bg-red-50 rounded-xl flex items-center justify-center border border-red-100 relative overflow-hidden">
                      <Image src="/images/mienian-logo-maroon.jpg" alt="Delivery" width={60} height={80} className="object-cover opacity-80" />
                    </div>
                 </div>
                 <div className="flex flex-col justify-center">
                    <h3 className="font-black text-sm">{availableKangCount > 0 ? "KangDoMie siap antar!" : "Coba pesan delivery (gratis!)"}</h3>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-1 mb-3">
                      Tinggal duduk dan tunggu, KangDoMie terdekat akan mengantarkan pesananmu~
                    </p>
                    <button 
                      onClick={() => document.getElementById("menu-catalog-section")?.scrollIntoView({ behavior: "smooth" })}
                      className="bg-[#C8102E] text-white rounded-full py-2.5 px-4 text-xs font-black flex items-center justify-between w-full shadow-md shadow-red-500/20 active:scale-95 transition-transform"
                    >
                      <span>PESAN DELIVERY</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>

            {/* PROMOTIONAL CAROUSEL */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 no-scrollbar">
              {promos.map((promo) => (
                <div key={promo.id} className="snap-center shrink-0 w-[85%] rounded-2xl h-[180px] bg-gray-100 relative overflow-hidden shadow-sm">
                   {promo.image ? (
                     <Image 
                       src={promo.image} 
                       alt={`Promo ${promo.id}`} 
                       fill
                       className="object-cover"
                       unoptimized
                     />
                   ) : null}
                </div>
              ))}
            </div>

            {/* MENU CATALOG (Appended so users can still order!) */}
            <div id="menu-catalog-section" className="pt-4 pb-12">
               <div className="bg-white rounded-t-[2rem] rounded-b-[2rem] shadow-sm border border-gray-200 overflow-hidden">
                 <div className="p-4 text-center border-b border-gray-100">
                   <h3 className="font-black text-[15px] text-gray-800">Menu Kami</h3>
                 </div>
                 
                 {isLoadingMenu ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                 ) : (
                  <div className="flex flex-col">
                    {categoriesToShow.map((cat, index) => {
                      const items = dbMenuItems.filter((m: any) => m.category === cat.id);
                      if (items.length === 0) return null;

                      return (
                        <div key={cat.id} className={`${index > 0 ? 'border-t border-dashed border-gray-200' : ''} p-5`}>
                          <h4 className="text-xs font-black text-[#6B5B95] uppercase flex items-center gap-2 mb-4">
                            <span>{cat.emoji}</span>
                            <span>{cat.title}</span>
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {items.map((item: any) => (
                              <div
                                key={item.id}
                                onClick={() => setSelectedCustomItem(item)}
                                className="flex flex-col items-center text-center cursor-pointer active:scale-95 transition-transform"
                              >
                                <div className="relative w-full aspect-square mb-2 bg-transparent">
                                  <img
                                    src={item.imageUrl || "/mienian-logo.png"}
                                    alt={item.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "/mienian-logo.png"; }}
                                  />
                                  {getItemQuantity(item.id) > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                                      {getItemQuantity(item.id)}
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-black text-xs leading-tight mb-1">{item.name.toUpperCase()}</h5>
                                <span className="text-gray-700 font-medium text-xs">{formatRupiah(item.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                 )}

                 <div className="p-5 pt-0">
                    <button 
                      className="bg-[#C8102E] text-white rounded-full py-3.5 w-full text-xs font-black tracking-wide flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                    >
                      LIHAT SEMUA MENU
                      <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>
               </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <Info className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="font-black text-lg text-gray-700">Halaman Menyusul</h3>
             <p className="text-xs text-gray-500 mt-2 max-w-[200px]">Fitur untuk halaman ini sedang dalam tahap pengembangan akhir.</p>
             <button onClick={() => setActiveTab("menu")} className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-full text-xs">Kembali ke Beranda</button>
          </div>
        )}
      </main>

      {/* ============ FLOATING BONUS WIDGET ============ */}
      {activeTab === "menu" && (
        <div className="fixed bottom-24 right-4 z-40 w-[90px] cursor-pointer hover:scale-105 transition-transform active:scale-95 drop-shadow-xl">
           <Image src="/images/bonus-widget.jpg" alt="Bonus Widget" width={90} height={90} className="rounded-full" />
        </div>
      )}

      {/* ============ BOTTOM NAVIGATION BAR ============ */}
      <BottomNavigation activeTab="home" />

      {/* ============ MENU CUSTOMIZATION SHEET ============ */}
      <CustomizationSheet
        item={selectedCustomItem}
        isOpen={!!selectedCustomItem}
        onClose={() => setSelectedCustomItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* ============ QUICK CART DRAWER ============ */}
      <QuickCartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
      />

      {/* ============ INFO MODAL (BACA LEBIH) ============ */}
      <AnimatePresence>
        {showNoKangDoMieModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          >
             <motion.div 
               initial={{ scale: 0.9 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0.9 }}
               className="bg-white rounded-3xl p-6 max-w-xs w-full text-center relative"
             >
                <div className="w-16 h-16 bg-red-100 text-[#C8102E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="font-black text-lg text-gray-900 mb-2">Area Belum Terjangkau</h3>
                <p className="text-xs text-gray-500 mb-6">
                  Saat ini armada KangDoMie belum tersedia di area kamu. Kami terus memperluas jangkauan layanan Mienian GO!
                </p>
                <button onClick={() => setShowNoKangDoMieModal(false)} className="w-full py-3 bg-[#C8102E] text-white font-bold rounded-xl text-sm">
                  Mengerti
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-sm rounded-3xl border border-gray-100 shadow-2xl p-6 relative"
            >
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">✕</button>
              <h2 className="text-2xl font-bold mb-1">{isLoginMode ? "Masuk Log" : "Buat Akun"}</h2>
              <p className="text-sm text-gray-500 mb-6">Silakan {isLoginMode ? "login" : "registrasi"} agar transaksi dapat dilacak.</p>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authError && <div className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded">{authError}</div>}
                <input type="email" placeholder="Email Pembeli" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:border-[#C8102E] focus:outline-none text-sm transition-colors" />
                <input type="password" placeholder="Kata Sandi" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:border-[#C8102E] focus:outline-none text-sm transition-colors" />
                <button type="submit" disabled={isSubmittingAuth} className="w-full py-4 bg-[#C8102E] text-white font-bold rounded-xl mt-2">{isSubmittingAuth ? "Memproses..." : isLoginMode ? "Masuk" : "Daftar Akun"}</button>
              </form>
              <div className="mt-6 text-center text-xs text-gray-500">
                {isLoginMode ? "Belum punya akun? " : "Sudah punya akun? "}
                <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-[#C8102E] font-bold">{isLoginMode ? "Daftar di sini" : "Login di sini"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
