"use client";

import { useBooking, CityCode } from "@/context/BookingContext";
import { CopyPlus, Trash2, MapPin, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { createOrder } from "@/lib/firestore";
import { useRouter } from "next/navigation";

const libraries: "places"[] = ["places"];

// Origin Addresses hardcoded from script
const KOTA_ORIGIN: Record<string, string> = {
  Jakarta: "Jl. Kelapa Gading No.2, Gandaria Selatan, Cilandak",
  Bandung: "Ujung Berung Indah, Bandung",
  Yogyakarta: "Jl. Subali No.2, Sariharjo, Sleman, Yogyakarta"
};

// Menu lists
const DAFTAR_MIE = [
  "Indomie Goreng Original", "Indomie Goreng Rendang", "Indomie Goreng Aceh", "Indomie Goreng Ayam Geprek",
  "Indomie Kari", "Indomie Soto", "Indomie Ayam Bawang", "Indomie Ayam Spesial", "Indomie Seblak", "Indomie Banglades'e"
];

const DAFTAR_TOPPING_REG = ["Cheese Dumpling", "Chicken Dumpling", "Baso Sapi", "Baso Ikan", "Baso Salmon", "Seafood Tofu", "Fishstick", "Chickuwa"];
const DAFTAR_TOPPING_PREM = ["Odeng Original", "Odeng Spicy", "Telur Ceplok"];
const DAFTAR_TOPPING_SUPER = ["Slice Beef (50gr)", "Grill Chicken", "Beef Enoki", "Chicken Katsu", "Kornet"];

export default function RegulerBookingPage() {
  const { state, dispatch } = useBooking();
  const router = useRouter();

  // Maps Setup
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC-JcHUBPoB4BLCkVus1PyXd7IPkWEEyHI",
    libraries,
  });
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Auth Setup
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Setup state on mount
  useEffect(() => {
    dispatch({ type: "RESET_WIZARD" });
    dispatch({ type: "SET_FIELD", payload: { field: "packageId", value: "reguler" } });
    dispatch({ type: "SET_FIELD", payload: { field: "stallType", value: "booth" } });

    // Init empty rows
    dispatch({ type: "SET_LINE_ITEM", payload: { category: "mie", items: [{ id: crypto.randomUUID(), name: "", qty: 0 }] } });
    dispatch({ type: "SET_LINE_ITEM", payload: { category: "toppingReg", items: [] } });
    dispatch({ type: "SET_LINE_ITEM", payload: { category: "toppingSuper", items: [] } });

    // Track auth
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user && user.email) {
        // Pre-fill email or name if we want
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/deps
  }, []);

  // --- MAPS LOGIC ---
  const calculateDistance = (dest: string, origin: string) => {
    if (!window.google) return;
    setCalculating(true);
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      { origins: [origin], destinations: [dest], travelMode: google.maps.TravelMode.DRIVING },
      (response, status) => {
        setCalculating(false);
        if (status === "OK" && response && response.rows[0].elements[0].status === "OK") {
          const km = response.rows[0].elements[0].distance.value / 1000;
          dispatch({ type: "SET_FIELD", payload: { field: "distanceKm", value: km } });
        } else {
          dispatch({ type: "SET_FIELD", payload: { field: "distanceKm", value: 0 } });
          alert("Alamat terlalu jauh atau tidak terjangkau rute mobil.");
        }
      }
    );
  };

  const onLoad = (autocompleteInst: google.maps.places.Autocomplete) => { setAutocomplete(autocompleteInst); };
  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        dispatch({ type: "SET_FIELD", payload: { field: "address", value: place.formatted_address } });
        if (state.city && KOTA_ORIGIN[state.city]) {
          calculateDistance(place.formatted_address, KOTA_ORIGIN[state.city]);
        }
      }
    }
  };

  useEffect(() => {
    if (state.city && state.address && window.google) {
      calculateDistance(state.address, KOTA_ORIGIN[state.city]);
    }
  }, [state.city]); // Recalculate if city changes

  // --- ROWS LOGIC ---
  const addRow = (category: "mie" | "toppingReg" | "toppingSuper") => {
    const list = state[category];
    if (category === "mie" && list.length >= 3) return;
    if (category === "toppingReg" && list.length >= 2) return;
    if (category === "toppingSuper" && list.length >= 1) return;

    dispatch({ type: "SET_LINE_ITEM", payload: { category, items: [...list, { id: crypto.randomUUID(), name: "", qty: 10 }] } });
  };
  const removeRow = (category: "mie" | "toppingReg" | "toppingSuper", id: string) => {
    dispatch({ type: "SET_LINE_ITEM", payload: { category, items: state[category].filter(i => i.id !== id) } });
  };
  const updateRow = (category: "mie" | "toppingReg" | "toppingSuper", id: string, field: "name" | "qty", val: string | number) => {
    dispatch({ type: "SET_LINE_ITEM", payload: { category, items: state[category].map(i => i.id === id ? { ...i, [field]: val } : i) } });
  };
  const handleStallToggle = (isChecked: boolean) => {
    dispatch({ type: "SET_FIELD", payload: { field: "stallType", value: isChecked ? "gerobak" : "booth" } });
  };

  // --- CHECKOUT LOGIC ---
  const isValidAmount = state.calculations.isValidReguler;
  const makananTotal = state.calculations.basePrice + state.calculations.extraPrice;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setShowAuthModal(false);
      proceedToDatabaseOrder();
    } catch (err: any) {
      setAuthError(err.message || "Gagal Autentikasi");
    }
  };

  const processSubmit = () => {
    if (!isValidAmount) return alert("Minimum pemesanan belum terpenuhi.");
    if (!state.name || !state.whatsapp || !state.city || !state.address || !state.date || !state.time) return alert("Mohon lengkapi data pemesan dan lokasi!");
    if (state.distanceKm === 0) return alert("Silakan perjelas alamat di Autocomplete Maps agar jarak KM dapat dihitung.");

    if (currentUser) {
      proceedToDatabaseOrder();
    } else {
      setShowAuthModal(true);
    }
  };

  const proceedToDatabaseOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderData = {
        userId: auth.currentUser?.uid || "guest",
        customerName: state.name,
        whatsapp: state.whatsapp,
        eventDate: state.date,
        eventTime: state.time,
        city: state.city,
        address: state.address,
        distanceKm: state.distanceKm,
        totalPorsi: state.calculations.totalPorsi,
        stallType: state.stallType,
        items: {
          mie: state.mie,
          toppingReg: state.toppingReg,
          toppingSuper: state.toppingSuper
        },
        costs: state.calculations,
        status: "pending_payment",
        paymentMethod: "statis"
      };

      const orderId = await createOrder(orderData);
      router.push(`/payment/${orderId}`);
    } catch (error: any) {
      const msg = error?.message || error?.code || "Unknown error";
      alert(`Gagal membuat order:\n${msg}`);
      console.error("Order creation error:", error);
      setIsSubmitting(false);
    }
  };

  const renderTable = (title: string, category: "mie" | "toppingReg" | "toppingSuper", options: string[], limit: number, priceStr: string) => {
    const list = state[category];
    return (
      <div className="bg-card p-5 rounded-2xl border border-card-border shadow-sm mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-sm sm:text-base text-foreground">{title} <span className="text-primary text-xs sm:text-sm font-normal">({priceStr})</span></h3>
          {list.length < limit && (
            <button onClick={() => addRow(category)} className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
              <CopyPlus className="w-3 h-3" /> Tambah (Max {limit})
            </button>
          )}
        </div>
        <div className="space-y-3 mt-4">
          {list.map(row => (
            <div key={row.id} className="flex gap-2">
              <select value={row.name} onChange={e => updateRow(category, row.id, "name", e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border bg-muted text-sm text-foreground focus:outline-none focus:border-primary appearance-none">
                <option value="">-- Pilih Varian --</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <input type="number" min="0" value={row.qty || ""} onChange={e => updateRow(category, row.id, "qty", parseInt(e.target.value) || 0)} placeholder="Porsi" className="w-20 px-3 py-2.5 text-center text-sm font-bold rounded-xl border bg-muted focus:outline-none focus:border-primary" />
              <button onClick={() => removeRow(category, row.id)} className="w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {list.length === 0 && <p className="text-xs text-foreground/50">Belum ada pilihan ditambahkan.</p>}
        </div>
      </div>
    );
  };

  const renderCarousel = (title: string, category: "mie" | "toppingReg" | "toppingPrem" | "toppingSuper", options: string[], limit: number, priceStr: string) => {
    const list = state[category];
    
    // We handle updates by checking if item exists; if not, add it; if qty becomes 0, remove it.
    const handleAdd = (name: string) => {
      const existing = list.find(l => l.name === name);
      if (existing) {
        updateRow(category, existing.id, "qty", (Number(existing.qty) || 0) + 1);
      } else {
        const activeVariants = list.filter(l => Number(l.qty) > 0).length;
        if (activeVariants >= limit) {
          alert(`Maksimal ${limit} varian`);
          return;
        }
        dispatch({ type: "SET_LINE_ITEM", payload: { category, items: [...list, { id: crypto.randomUUID(), name, qty: 1 }] } });
      }
    };

    const handleMinus = (name: string) => {
      const existing = list.find(l => l.name === name);
      if (!existing) return;
      const newQty = (Number(existing.qty) || 0) - 1;
      if (newQty <= 0) {
        removeRow(category, existing.id);
      } else {
        updateRow(category, existing.id, "qty", newQty);
      }
    };
    
    const updateInput = (name: string, valStr: string) => {
      const val = parseInt(valStr) || 0;
      const existing = list.find(l => l.name === name);
      if (existing) {
        if (val <= 0) removeRow(category, existing.id);
        else updateRow(category, existing.id, "qty", val);
      } else {
        if (val > 0) {
          const activeVariants = list.filter(l => Number(l.qty) > 0).length;
          if (activeVariants >= limit) {
             alert(`Maksimal ${limit} varian`);
             return;
          }
          dispatch({ type: "SET_LINE_ITEM", payload: { category, items: [...list, { id: crypto.randomUUID(), name, qty: val }] } });
        }
      }
    };

    const activeVariants = list.filter(l => Number(l.qty) > 0).length;

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm sm:text-base text-foreground">{title} <span className="text-primary text-xs sm:text-sm font-normal">({priceStr})</span></h3>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{activeVariants}/{limit} Varian Dipilih</span>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {options.map(opt => {
             const existing = list.find(l => l.name === opt);
             const qty = existing ? (Number(existing.qty) || 0) : 0;
             const isActive = qty > 0;
             
             return (
               <div key={opt} className={`snap-start shrink-0 w-[160px] rounded-2xl border-2 ${isActive ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-card-border bg-card shadow-sm'} p-3 flex flex-col justify-between transition-all duration-300`}>
                 <div className="aspect-[4/3] bg-background border border-card-border rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                   <span className={`text-4xl transition-transform duration-300 ${isActive ? 'scale-110' : 'grayscale opacity-50'}`}>🍜</span>
                 </div>
                 <div className="font-bold text-sm text-foreground mb-3 leading-snug line-clamp-2 min-h-[2.5rem]">{opt}</div>
                 <div className="flex items-center justify-between bg-background rounded-full border border-card-border shadow-sm p-1">
                   <button onClick={() => handleMinus(opt)} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-foreground/50 hover:bg-muted-foreground'}`}>-</button>
                   <input type="number" min="0" value={qty === 0 ? "" : qty} onChange={e => updateInput(opt, e.target.value)} placeholder="0" className="w-10 text-center font-bold text-sm bg-transparent outline-none focus:text-primary transition-colors appearance-none m-0" style={{MozAppearance: 'textfield'}} />
                   <button onClick={() => handleAdd(opt)} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${isActive ? 'bg-primary text-white hover:bg-primary/90' : 'bg-muted text-foreground hover:bg-muted-foreground'}`}>+</button>
                 </div>
               </div>
             )
          })}
          <div className="snap-start shrink-0 w-2 sm:hidden"></div>
        </div>
      </div>
    );
  };

  if (state.packageId !== "reguler" || isAuthLoading) return <div className="min-h-screen flex items-center justify-center text-foreground/50">Memuat Mempersiapkan Sistem...</div>;

  return (
    <div className="min-h-screen bg-background pb-24 pt-32 relative">
      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-card-border shadow-2xl p-6 relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground">✕</button>
            <h2 className="text-2xl font-bold mb-1">{isLoginMode ? "Masuk Log" : "Buat Akun"}</h2>
            <p className="text-sm text-foreground/60 mb-6">Silakan {isLoginMode ? "login" : "registrasi"} agar transaksi dapat dilacak dan mengamankan bukti pembayaran Anda.</p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authError && <div className="text-xs text-red-500 font-bold bg-red-500/10 p-2 rounded">{authError}</div>}
              <input type="email" placeholder="Email Pembeli" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border bg-muted focus:border-primary focus:outline-none text-sm transition-colors" />
              <input type="password" placeholder="Kata Sandi" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl border bg-muted focus:border-primary focus:outline-none text-sm transition-colors" />
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-primary text-white font-bold rounded-xl mt-2">{isSubmitting ? "Memproses..." : isLoginMode ? "Masuk & Lanjutkan" : "Daftar & Lanjutkan"}</button>
            </form>
            <div className="mt-6 text-center text-xs">
              {isLoginMode ? "Belum punya akun? " : "Sudah punya akun? "}
              <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-primary font-bold">{isLoginMode ? "Daftar di sini" : "Login di sini"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4">

        <h1 className="text-3xl font-extrabold mb-2 text-foreground">Pesan Reguler </h1>
        <p className="text-foreground/60 mb-8 text-sm">Pilih porsi bebas sesuka hatimu. Kami akan menghitung biaya secara transparan.</p>

        {/* Info T&C & Stall */}
        <div className="bg-primary/10 border border-primary/30 p-5 sm:p-6 rounded-2xl mb-8">
          <h2 className="font-bold text-primary mb-3">Ketentuan Pemesanan Reguler Mienian Catering</h2>
          <ul className="text-sm space-y-2 text-foreground/80 list-disc pl-4 mb-5">
            <li>Nilai minimum transaksi (Minimum Order Value) sebesar <b>Rp 700.000</b> di luar biaya transport ke lokasi acara.</li>
            <li>Menggunakan <b>Stall Portable</b> (seperti pada gambar).</li>
            <li>Sudah termasuk <b>1 Orang Pramusaji/Petugas</b> (maksimum sampai dengan 70 porsi).</li>
            <li>Penambahan <b>Pramusaji/Petugas</b> menyesuaikan jumlah porsi dan jumlah topping.</li>
            <li>Hanya berlaku <b>Mixed Topping</b> dalam satu kategori.</li>
          </ul>
          <label className="flex items-start gap-4 p-4 bg-background rounded-xl border border-primary/20 cursor-pointer shadow-sm hover:border-primary transition-colors mb-4">
            <input type="checkbox" checked={state.stallType === "gerobak"} onChange={e => handleStallToggle(e.target.checked)} className="w-5 h-5 accent-primary mt-1" />
            <div>
              <span className="font-bold block text-sm">Upgrade Stall menggunakan Gerobak unik dengan menambah Rp 250.000 </span>
              <span className="text-xs text-foreground/60 mt-1 block leading-relaxed">Gerobak Mienian bikin acara kamu semakin stand out dan berkesan. Upgrade stall otomatis mewajibkan ekstra 1 staf (+ Rp 75.000).</span>
            </div>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background rounded-xl overflow-hidden border border-primary/20 shadow-sm relative group">
              <span className="absolute top-2 left-2 bg-foreground text-background text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full z-10 shadow">Stall Portable (Bawaan)</span>
              <div className="aspect-[4/3] w-full bg-muted relative">
                <img src="/images/stall_portable.png" alt="Stall Portable" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
            <div className="bg-background rounded-xl overflow-hidden border border-primary/20 shadow-sm relative group">
              <span className="absolute top-2 left-2 bg-primary text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full z-10 shadow">Stall Gerobak (Upgrade)</span>
              <div className="aspect-[4/3] w-full bg-muted relative">
                <img src="/images/stall_gerobak.png" alt="Stall Gerobak" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Menu Selection */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span> Pilih Mie dan Topping</h2>
        <p className="text-xs text-foreground/50 mb-4">* Silakan input nominal porsi di setiap varian yang Anda kehendaki.</p>

        {renderCarousel("Pilih Varian Mie", "mie", DAFTAR_MIE, 3, "Rp 8.500/porsi")}
        {renderCarousel("Pilih Topping Reguler", "toppingReg", DAFTAR_TOPPING_REG, 2, "Rp 3.500/pc")}
        {renderCarousel("Pilih Topping Premium", "toppingPrem", DAFTAR_TOPPING_PREM, 2, "Rp 6.500/pc")}
        {renderCarousel("Pilih Topping Super", "toppingSuper", DAFTAR_TOPPING_SUPER, 1, "Rp 11.000/pc")}

        {/* Progress Makanan */}
        <div className={`p-4 sm:p-5 rounded-2xl text-center font-bold my-8 border transition-colors ${isValidAmount ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
          <span className="block text-xs sm:text-sm mb-1 opacity-80">Total Tagihan Sementara:</span>
          <span className="text-2xl sm:text-3xl">Rp {makananTotal.toLocaleString("id-ID")}</span>
          {!isValidAmount && (
            <div className="mt-3 py-1.5 px-3 bg-red-500/20 rounded inline-block text-xs">
              ⚠️ Masih kurang <b>Rp {(700000 - makananTotal).toLocaleString("id-ID")}</b> untuk mencapai batas minimun pesanan.
            </div>
          )}
        </div>

        {/* Data & Alamat (Revealed only if valid) */}
        <div className={`transition-all duration-700 ease-out origin-top ${!isValidAmount ? 'opacity-30 pointer-events-none scale-95 blur-[1px]' : 'opacity-100 scale-100 blur-0'}`}>
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span> Detail PIC & Lokasi</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-foreground/70">Nama Lengkap PIC</label>
              <input type="text" placeholder="John Doe" value={state.name} onChange={e => dispatch({ type: "SET_FIELD", payload: { field: "name", value: e.target.value } })} className="w-full px-4 py-3 rounded-xl border bg-card focus:border-primary focus:outline-none text-sm transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-foreground/70">Nomor WhatsApp Aktif</label>
              <input type="text" placeholder="0812xxxxxx" value={state.whatsapp} onChange={e => dispatch({ type: "SET_FIELD", payload: { field: "whatsapp", value: e.target.value } })} className="w-full px-4 py-3 rounded-xl border bg-card focus:border-primary focus:outline-none text-sm transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-foreground/70">Area Dapur Acara</label>
              <select value={state.city} onChange={e => dispatch({ type: "SET_FIELD", payload: { field: "city", value: e.target.value } })} className="w-full px-4 py-3 rounded-xl border bg-card focus:border-primary focus:outline-none text-sm transition-colors appearance-none">
                <option value="">-- Pilih Wilayah Operasi --</option>
                <option value="Jakarta">Jakarta & BODETABEK</option>
                <option value="Bandung">Bandung Raya</option>
                <option value="Yogyakarta">D.I Yogyakarta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-foreground/70">Alamat Peta (Autocompletion) <span className="text-primary">*</span></label>
              <div className="relative">
                <MapPin className="absolute top-3.5 left-3 w-4 h-4 text-foreground/40" />
                {isLoaded ? (
                  <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                    <input type="text" value={state.address} onChange={e => dispatch({ type: "SET_FIELD", payload: { field: "address", value: e.target.value } })} placeholder="Ketik jalan / gedung Google Maps" className="w-full pl-9 pr-4 py-3 rounded-xl border bg-card focus:border-primary focus:outline-none text-sm transition-colors" required />
                  </Autocomplete>
                ) : (
                  <input type="text" disabled placeholder="Loading maps..." className="w-full pl-9 pr-4 py-3 rounded-xl border bg-card opacity-50" />
                )}
              </div>
              {calculating && <div className="text-[10px] text-primary mt-1 animate-pulse flex items-center gap-1"><Rocket className="w-3 h-3" /> Menghitung KM...</div>}
              {!calculating && state.distanceKm > 0 && <div className="text-[10px] text-green-500 font-bold mt-1">Terdeteksi: {state.distanceKm.toFixed(1)} KM</div>}
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-foreground/70">Tanggal Acara</label>
              <input type="date" value={state.date} onChange={e => dispatch({ type: "SET_FIELD", payload: { field: "date", value: e.target.value } })} className="w-full px-4 py-3 rounded-xl border bg-card focus:border-primary focus:outline-none text-sm transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-foreground/70">Waktu Mulai Sajian</label>
              <input type="time" value={state.time} onChange={e => dispatch({ type: "SET_FIELD", payload: { field: "time", value: e.target.value } })} className="w-full px-4 py-3 rounded-xl border bg-card focus:border-primary focus:outline-none text-sm transition-colors" />
            </div>
          </div>

          <div className="bg-card p-6 sm:p-8 rounded-3xl border-2 border-primary/20 shadow-2xl relative overflow-hidden mt-8">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-xl font-extrabold mb-6">Ringkasan Total Pesanan</h2>
            <div className="space-y-3 text-sm text-foreground/80 mb-6 pb-6 border-b border-card-border relative z-10">
              {state.mie.map(item => item.name && Number(item.qty) > 0 ? (
                <div key={item.id} className="flex justify-between items-center text-foreground">
                  <span>{item.name} ({item.qty} Porsi)</span>
                  <span className="font-bold">Rp {(Number(item.qty) * 8500).toLocaleString("id-ID")}</span>
                </div>
              ) : null)}
              {state.toppingReg.map(item => item.name && Number(item.qty) > 0 ? (
                <div key={item.id} className="flex justify-between items-center text-foreground/80">
                  <span>{item.name} ({item.qty} Porsi)</span>
                  <span className="font-bold">Rp {(Number(item.qty) * 3500).toLocaleString("id-ID")}</span>
                </div>
              ) : null)}
              {state.toppingPrem.map(item => item.name && Number(item.qty) > 0 ? (
                <div key={item.id} className="flex justify-between items-center text-foreground/80">
                  <span>{item.name} ({item.qty} Porsi)</span>
                  <span className="font-bold">Rp {(Number(item.qty) * 6500).toLocaleString("id-ID")}</span>
                </div>
              ) : null)}
              {state.toppingSuper.map(item => item.name && Number(item.qty) > 0 ? (
                <div key={item.id} className="flex justify-between items-center text-foreground/80">
                  <span>{item.name} ({item.qty} Porsi)</span>
                  <span className="font-bold">Rp {(Number(item.qty) * 11000).toLocaleString("id-ID")}</span>
                </div>
              ) : null)}
              {state.calculations.extraFee > 0 && (
                <div className="flex justify-between items-center text-foreground/80">
                  <span>Upgrade Stall (Gerobak)</span>
                  <span className="font-bold text-foreground">Rp {state.calculations.extraFee.toLocaleString("id-ID")}</span>
                </div>
              )}
              {state.calculations.staffFee > 0 && (
                <div className="flex justify-between items-center text-foreground/80">
                  <span>Petugas Tambahan</span>
                  <span className="font-bold text-foreground">Rp {state.calculations.staffFee.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-foreground/60 italic mt-2 pt-2 border-t border-dashed">
                <span>Ongkos Kirim PP ({state.distanceKm.toFixed(1)} KM)</span>
                <span>Rp {state.calculations.transportFee.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 relative z-10">
              <span className="font-bold text-lg mb-1 sm:mb-0">Grand Total Tagihan</span>
              <span className="font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">Rp {state.calculations.grandTotal.toLocaleString("id-ID")}</span>
            </div>

            <button onClick={processSubmit} disabled={!isValidAmount || isSubmitting} className="w-full py-4 bg-primary text-white font-extrabold rounded-2xl hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 disabled:opacity-50 transition-all text-lg shadow-xl shadow-primary/20 relative z-10">
              {isSubmitting ? "Memproses Data..." : "Checkout & Bayar Sekarang"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
