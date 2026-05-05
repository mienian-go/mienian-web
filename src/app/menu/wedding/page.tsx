"use client";

import { useBooking, CityCode } from "@/context/BookingContext";
import { CopyPlus, Trash2, MapPin, Rocket, CheckCircle2, PartyPopper } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { createOrder, updateUserProfile } from "@/lib/firestore";
import { useRouter, useSearchParams } from "next/navigation";

const libraries: "places"[] = ["places"];

// Origin Addresses hardcoded from script
const KOTA_ORIGIN: Record<string, string> = {
  Jakarta: "Jl. Kelapa Gading No.2, Gandaria Selatan, Cilandak",
  Bandung: "Ujung Berung Indah, Bandung",
  Yogyakarta: "Jl. Subali No.2, Sariharjo, Sleman, Yogyakarta"
};

// Menu lists & Packages
import { cateringPackages, formatRupiah } from "@/data/menu";

const weddingPackages = cateringPackages.filter(p => p.category === "wedding");

const DAFTAR_MIE = [
  "Indomie Goreng Original", "Indomie Goreng Rendang", "Indomie Goreng Aceh", "Indomie Goreng Ayam Geprek",
  "Indomie Kari", "Indomie Soto", "Indomie Ayam Bawang", "Indomie Ayam Spesial", "Indomie Seblak", "Indomie Banglades'e"
];

const DAFTAR_TOPPING_REG = ["Cheese Dumpling", "Chicken Dumpling", "Baso Sapi", "Baso Ikan", "Baso Salmon", "Seafood Tofu", "Fishstick", "Chickuwa"];
const DAFTAR_TOPPING_PREM = ["Odeng Original", "Odeng Spicy", "Telur Ceplok"];
const DAFTAR_TOPPING_SUPER = ["Slice Beef (50gr)", "Grill Chicken", "Beef Enoki", "Chicken Katsu", "Kornet"];

function WeddingBookingContent() {
  const { state, dispatch } = useBooking();
  const selectedPkg = weddingPackages.find(p => p.id === state.packageId) || null;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Maps Setup
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBgj6aPrkcd-B2lWsE0_AdA8PQpbO13R7c",
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
    dispatch({ type: "SET_FIELD", payload: { field: "packageId", value: "" } });
    dispatch({ type: "SET_FIELD", payload: { field: "stallType", value: "gerobak" } });

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

    // Capture affiliate from URL
    const aff = searchParams.get("aff") || searchParams.get("ref");
    if (aff) {
      dispatch({ type: "SET_FIELD", payload: { field: "affiliateCode", value: aff } });
    }

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
  const addRow = (category: "mie" | "toppingReg" | "toppingReg2" | "toppingPrem" | "toppingSuper") => {
    const list = state[category] || [];
    if (category === "mie" && list.length >= 3) return;
    if ((category === "toppingReg" || category === "toppingReg2") && list.length >= 2) return;
    if (category === "toppingSuper" && list.length >= 1) return;

    dispatch({ type: "SET_LINE_ITEM", payload: { category, items: [...list, { id: crypto.randomUUID(), name: "", qty: 10 }] } });
  };
  const removeRow = (category: "mie" | "toppingReg" | "toppingReg2" | "toppingPrem" | "toppingSuper", id: string) => {
    dispatch({ type: "SET_LINE_ITEM", payload: { category, items: (state[category] || []).filter(i => i.id !== id) } });
  };
  const updateRow = (category: "mie" | "toppingReg" | "toppingReg2" | "toppingPrem" | "toppingSuper", id: string, field: "name" | "qty", val: string | number) => {
    dispatch({ type: "SET_LINE_ITEM", payload: { category, items: (state[category] || []).map(i => i.id === id ? { ...i, [field]: val } : i) } });
  };
  const handleStallToggle = (isChecked: boolean) => {
    dispatch({ type: "SET_FIELD", payload: { field: "stallType", value: isChecked ? "gerobak" : "booth" } });
  };

  // --- CHECKOUT LOGIC ---
  const totalMie = (state.mie || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalTopReg = (state.toppingReg || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalTopReg2 = (state.toppingReg2 || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalTopPrem = (state.toppingPrem || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalTopSuper = (state.toppingSuper || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  let reqTopReg = 0;
  let reqTopReg2 = 0;
  let reqTopPrem = 0;
  let reqTopSuper = 0;
  if (selectedPkg) {
    const isPaketOdeng = selectedPkg.name === "Paket Odeng";
    const primaryQty = isPaketOdeng ? totalTopPrem : totalMie;
    const totalPorsi = Math.max(primaryQty, selectedPkg.portions);

    if (selectedPkg.name.includes("Satu Topping")) {
      reqTopReg = totalPorsi;
    } else if (selectedPkg.name.includes("Dua Topping")) {
      reqTopReg = totalPorsi;
      reqTopReg2 = totalPorsi;
    }

    if (selectedPkg.name.includes("Premium") || selectedPkg.name.includes("Komplit") || selectedPkg.name.includes("Odeng")) {
      reqTopPrem = totalPorsi;
    }
    if (selectedPkg.name.includes("Super")) {
      reqTopSuper = totalPorsi;
    }
  }

  const isValidAmount = !!selectedPkg &&
    (selectedPkg.name === "Paket Odeng" || totalMie >= selectedPkg.portions) &&
    totalTopReg === reqTopReg &&
    totalTopReg2 === reqTopReg2 &&
    totalTopPrem === reqTopPrem &&
    totalTopSuper === reqTopSuper;
  const makananTotal = state.calculations.basePrice + state.calculations.extraPrice;

  useEffect(() => {
    const hasKuah = (state.mie || []).some(m => m.name.includes("Soto") || m.name.includes("Kari") || m.name.includes("Bawang") || m.name.includes("Seblak"));
    if (hasKuah && !state.addWaterBoiler) {
      dispatch({ type: "SET_FIELD", payload: { field: "addWaterBoiler", value: true } });
    }
  }, [state.mie, state.addWaterBoiler, dispatch]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        // Sync user to Firestore
        await updateUserProfile(userCredential.user.uid, {
          email: authEmail,
          name: state.name,
          whatsapp: state.whatsapp,
        });
      }
      setShowAuthModal(false);
      proceedToDatabaseOrder();
    } catch (err: any) {
      setAuthError(err.message || "Gagal Autentikasi");
    }
  };

  const processSubmit = () => {
    if (!selectedPkg) return alert("Silakan pilih paket wedding terlebih dahulu.");
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
        email: auth.currentUser?.email || "",
        customerName: state.name,
        whatsapp: state.whatsapp,
        eventDate: state.date,
        eventTime: state.time,
        city: state.city,
        address: state.address,
        distanceKm: state.distanceKm,
        totalPorsi: state.calculations.totalPorsi,
        stallType: state.stallType,
        komporType: state.komporType,
        tableCount: state.tableCount,
        addWaterBoiler: state.addWaterBoiler,
        packageId: state.packageId,
        packageName: selectedPkg?.name || "",
        items: {
          mie: state.mie,
          toppingReg: state.toppingReg,
          toppingPrem: state.toppingPrem,
          toppingSuper: state.toppingSuper
        },
        costs: state.calculations,
        affiliateCode: state.affiliateCode || "",
        status: "pending_payment",
        paymentMethod: "doku",
        orderType: "wedding"
      };

      const orderId = await createOrder(orderData);

      // Call DOKU Checkout API
      try {
        const dokuRes = await fetch("/api/doku/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            amount: state.calculations.grandTotal,
            customerName: state.name,
            customerEmail: auth.currentUser?.email || "",
            invoiceNumber: `MIENIAN-${orderId}`,
          }),
        });
        const dokuData = await dokuRes.json();

        if (dokuData.paymentUrl) {
          // Redirect to DOKU payment page
          window.location.href = dokuData.paymentUrl;
          return;
        }
      } catch (dokuErr) {
        console.warn("DOKU payment failed, falling back to manual:", dokuErr);
      }

      // Fallback to manual payment page if DOKU fails
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

  const renderCarousel = (title: string, category: "mie" | "toppingReg" | "toppingReg2" | "toppingPrem" | "toppingSuper", options: any[], limit: number, priceStr: string) => {
    const list = state[category] || [];

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

            const slug = opt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const imageSrc = `/images/menu/${slug}.jpg`;

            return (
              <div key={opt} className={`snap-start shrink-0 w-[160px] rounded-2xl border-2 ${isActive ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-card-border bg-card shadow-sm'} p-3 flex flex-col justify-between transition-all duration-300`}>
                <div className="aspect-square bg-background border border-card-border rounded-xl mb-3 flex items-center justify-center relative overflow-hidden group">
                  <span className={`text-4xl transition-transform duration-300 ${isActive ? 'scale-110' : 'grayscale opacity-50 relative z-0'}`}>🍜</span>
                  <img
                    src={imageSrc}
                    alt={opt}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 z-10 ${isActive ? 'scale-105' : 'grayscale-[50%] group-hover:scale-105 group-hover:grayscale-0'}`}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="font-bold text-sm text-foreground mb-3 leading-snug line-clamp-2 min-h-[2.5rem]">{opt}</div>
                <div className="flex items-center justify-between bg-background rounded-full border border-card-border shadow-sm p-1">
                  <button onClick={() => handleMinus(opt)} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-foreground/50 hover:bg-muted-foreground'}`}>-</button>
                  <input type="number" min="0" value={qty === 0 ? "" : qty} onChange={e => updateInput(opt, e.target.value)} placeholder="0" className="w-10 text-center font-bold text-sm bg-transparent outline-none focus:text-primary transition-colors appearance-none m-0" style={{ MozAppearance: 'textfield' }} />
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

  if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center text-foreground/50">Memuat Mempersiapkan Sistem...</div>;

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

        <h1 className="text-3xl font-extrabold mb-2 text-foreground flex items-center gap-3"><PartyPopper className="w-8 h-8 text-secondary" /> Paket Wedding</h1>
        <p className="text-foreground/60 mb-8 text-sm">Pindahin Warmindo ke acara pernikahan kamu, lalu tentukan varian mie & topping favoritmu.</p>

        {/* Info T&C Wedding */}
        <div className="bg-secondary/10 border border-secondary/30 p-5 sm:p-6 rounded-2xl mb-8">
          <h2 className="font-bold text-secondary mb-3">Ketentuan Pemesanan Paket</h2>
          <ul className="text-sm space-y-2 text-foreground/80 list-disc pl-4">
            <li>Pilih salah satu Paket yang ada.</li>
            <li>Jumlah porsi bisa ditambah, namun tidak bisa dikurangi.</li>
            <li>Setiap paket sudah termasuk sawi & topping sesuai deskripsi.</li>
            <li>Penambahan porsi dihitung sesuai harga <b>satuan paket</b>.</li>
            <li>Bisa pilih menggunakan <b>Stall Gerobak atau portable</b> (sudah termasuk).</li>
            <li>Outdoor menggunakan kompor gas tabung gas 3kg/5kg.</li>
            <li>Butuh listrik 350 watt untuk water boiler (jika ada pilihan mie kuah).</li>
            <li>Indoor bisa menggunakan Kompor Gas atau Kompor Listrik</li>
            <li>Kompor listrik butuh 500-700 watt tergantung jumlah porsi (tbd).</li>
            <li>Tim tiba di lokasi H-3 jam sebelum serving untuk preparation</li>
            <li>Butuh disiapkan 1 meja untuk serving</li>
            <li>Sudah termasuk <b>2 Orang Petugas</b> untuk full payment.</li>
            <li>Booking/Lock tanggal dan jam hanya berlaku setelah melakukan pembayaran</li>
            <li>Lakukan pembayaran setelah invoice diterbitkan</li>
            <li>Maksimum serving 3 jam</li>
            <li>Pembayaran hanya ke Rekening PT Mie Kekinian Sukses atau QRIS a/n Mienian</li>
            <li>Pastikan dapat QRIS atas nama Mienian dari nomor official Admin</li>
            <li>Pesanan yang sudah dibayar tidak bisa cancel atau refund</li>
          </ul>
        </div>

        {/* Step 1: Package Selection */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">1</span> Pilih Paket</h2>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-8">
          {weddingPackages.map((pkg, idx) => {
            const isSelected = state.packageId === pkg.id;
            const imgSrc = pkg.image || `/images/paket-wedding-${(idx % 6) + 1}.jpg`;
            return (
              <button key={pkg.id} onClick={() => {
                if (!isSelected) {
                  dispatch({ type: "SELECT_PACKAGE", payload: { packageId: pkg.id } });
                }
              }} className={`snap-start shrink-0 w-[220px] relative text-left rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden ${isSelected ? 'border-secondary bg-secondary/10 shadow-lg shadow-secondary/10' : 'border-card-border bg-card hover:border-secondary/40'}`}>
                {isSelected && <CheckCircle2 className="absolute top-3 right-3 w-6 h-6 text-secondary z-20" />}
                <div className="aspect-[4/5] w-full bg-muted relative overflow-hidden">
                  <img src={imgSrc} alt={pkg.name} className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isSelected ? 'scale-105' : 'grayscale-[30%] group-hover:scale-105'}`} />
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-bold text-sm mb-1 pr-4">{pkg.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-secondary">{formatRupiah(pkg.price)}</span>
                    <span className="text-[10px] text-foreground/50">/ {pkg.portions} porsi</span>
                  </div>
                </div>
              </button>
            );
          })}
          <div className="snap-start shrink-0 w-2 sm:hidden"></div>
        </div>

        {/* Step 2: Variant Selection (only if package selected) */}
        <div className={`transition-all duration-500 ${!selectedPkg ? 'opacity-30 pointer-events-none blur-[1px]' : ''}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">2</span> {selectedPkg?.name === "Mie tanpa Topping" ? "Pilih Varian Mie" : "Pilih Varian Mie & Topping"}</h2>
          <p className="text-xs text-foreground/50 mb-4">* {selectedPkg ? `Kuota bawaan paket: ${selectedPkg.portions} porsi mie. Tambahan di luar kuota dihitung extra.` : 'Pilih paket terlebih dahulu.'}</p>

          {/* Mie: all packages except "Paket Odeng" */}
          {selectedPkg?.name !== "Paket Odeng" && renderCarousel("Pilih Varian Mie", "mie", DAFTAR_MIE, 3, "Rp 8.500/porsi")}

          {/* Topping Reguler 1: Satu Topping, Dua Topping */}
          {selectedPkg && (selectedPkg.name.includes("Satu Topping") || selectedPkg.name.includes("Dua Topping")) && renderCarousel("Pilih Topping Reguler 1", "toppingReg", DAFTAR_TOPPING_REG, selectedPkg.name.includes("Satu Topping") ? 2 : 1, "Rp 3.500/pc")}

          {/* Topping Reguler 2: Dua Topping */}
          {selectedPkg && (selectedPkg.name.includes("Dua Topping")) && renderCarousel("Pilih Topping Reguler 2", "toppingReg2", DAFTAR_TOPPING_REG, 1, "Rp 3.500/pc")}

          {/* Auto-filled Topping Pendamping for Paket Odeng & Komplit */}
          {selectedPkg && (selectedPkg.name === "Paket Odeng" || selectedPkg.name.includes("Komplit")) && (
            <div className="mb-8">
              <h3 className="font-bold text-sm sm:text-base text-foreground mb-3">Topping Pendamping <span className="text-primary text-xs sm:text-sm font-normal">(Otomatis)</span></h3>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm text-foreground/80">
                <p className="mb-2"><strong>Cheese Dumpling</strong> dan <strong>Chicken Dumpling</strong> otomatis ditambahkan mengikuti jumlah porsi Odeng yang Anda pilih.</p>
                <div className="flex gap-4 font-bold text-primary">
                  <span>- Cheese Dumpling ({Math.max(totalTopPrem, selectedPkg.portions)} Porsi)</span>
                  <span>- Chicken Dumpling ({Math.max(totalTopPrem, selectedPkg.portions)} Porsi)</span>
                </div>
              </div>
            </div>
          )}

          {/* Topping Premium / Odeng: Topping Odeng, Komplit, Paket Odeng, Premium */}
          {selectedPkg && (selectedPkg.name.includes("Odeng") || selectedPkg.name.includes("Komplit") || selectedPkg.name.includes("Premium")) &&
            renderCarousel("Pilih Topping Premium", "toppingPrem",
              (selectedPkg.name.includes("Odeng") || selectedPkg.name.includes("Komplit"))
                ? DAFTAR_TOPPING_PREM.filter(t => t.includes("Odeng"))
                : DAFTAR_TOPPING_PREM,
              2, "Rp 6.600/pc")}

          {/* Topping Super: Topping Super */}
          {selectedPkg && (selectedPkg.name.includes("Super")) && renderCarousel("Pilih Topping Super", "toppingSuper", DAFTAR_TOPPING_SUPER, 1, "Rp 11.000/pc")}

          {/* Progress Makanan */}
          <div className={`p-4 sm:p-5 rounded-2xl text-center font-bold my-8 border transition-colors ${selectedPkg ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'}`}>
            {selectedPkg && <span className="block text-xs mb-1 opacity-60">Paket: {selectedPkg.name}</span>}
            <span className="block text-xs sm:text-sm mb-1 opacity-80">{selectedPkg ? 'Total Tagihan Makanan:' : 'Belum ada paket dipilih'}</span>
            {selectedPkg && <span className="text-2xl sm:text-3xl">Rp {makananTotal.toLocaleString("id-ID")}</span>}
            {selectedPkg && state.calculations.extraPrice > 0 && (
              <div className="mt-2 py-1 px-3 bg-secondary/10 rounded inline-block text-xs text-secondary">
                Termasuk extra porsi: Rp {state.calculations.extraPrice.toLocaleString("id-ID")}
              </div>
            )}
            {!isValidAmount && selectedPkg && (
              <div className="mt-3 py-1.5 px-3 bg-red-500/20 rounded inline-block text-xs text-red-600 font-bold w-full sm:w-auto text-left sm:text-center">
                ⚠️ Total porsi mie dan topping tidak sesuai. Harap pastikan jumlah porsi topping sama persis dengan mie.
              </div>
            )}
          </div>
        </div> {/* close step 2 wrapper */}

        {/* Step 3: Peralatan Masak & Stall */}
        <div className={`transition-all duration-700 ease-out origin-top ${!isValidAmount ? 'opacity-30 pointer-events-none scale-95 blur-[1px]' : 'opacity-100 scale-100 blur-0'} mb-8`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">3</span> Peralatan Masak & Stall</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`bg-background rounded-xl overflow-hidden border shadow-sm relative group cursor-pointer transition-all ${state.stallType === "booth" ? 'border-secondary ring-2 ring-secondary/50' : 'border-card-border hover:border-secondary/50'}`} onClick={() => dispatch({ type: "SET_FIELD", payload: { field: "stallType", value: "booth" } })}>
              <span className="absolute top-2 left-2 bg-foreground text-background text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full z-10 shadow">Stall Portable</span>
              {state.stallType === "booth" && <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-secondary z-20" />}
              <div className={`aspect-[4/3] w-full relative ${state.stallType === "booth" ? '' : 'opacity-70'} transition-all bg-muted`}>
                <img src="/images/stall_portable.png" alt="Stall Portable" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
            <div className={`bg-background rounded-xl overflow-hidden border shadow-sm relative group cursor-pointer transition-all ${state.stallType === "gerobak" ? 'border-secondary ring-2 ring-secondary/50' : 'border-card-border hover:border-secondary/50'}`} onClick={() => dispatch({ type: "SET_FIELD", payload: { field: "stallType", value: "gerobak" } })}>
              <span className="absolute top-2 left-2 bg-secondary text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full z-10 shadow">Stall Gerobak</span>
              {state.stallType === "gerobak" && <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-secondary z-20" />}
              <div className={`aspect-[4/3] w-full relative ${state.stallType === "gerobak" ? '' : 'opacity-70'} transition-all bg-muted`}>
                <img src="/images/stall_gerobak.png" alt="Stall Gerobak" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>

          <div className="bg-card p-5 rounded-2xl border border-card-border shadow-sm">
            <h3 className="font-bold text-sm mb-4">Checklist Peralatan Tambahan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-2 text-foreground/70">Pilihan Kompor</label>
                <select value={state.komporType} onChange={e => dispatch({ type: "SET_FIELD", payload: { field: "komporType", value: e.target.value } })} className="w-full px-4 py-3 rounded-xl border bg-muted focus:border-secondary focus:outline-none text-sm transition-colors appearance-none">
                  <option value="">-- Pilih Kompor --</option>
                  <option value="Kompor + Gas 3Kg">Kompor + Gas 3Kg (Free)</option>
                  <option value="Kompor + Gas 5Kg">Kompor + Gas 5Kg (Free)</option>
                  <option value="Kompor Listrik 500 watt">Kompor Listrik 500 watt/kompor (Free)</option>
                  <option value="Kompor Gas portable HiCook">Kompor Gas portable HiCook (+ Rp 100.000)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">Sewa Meja</div>
                  <div className="text-xs text-foreground/60">Rp 100.000 / unit</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => dispatch({ type: "SET_FIELD", payload: { field: "tableCount", value: Math.max(0, state.tableCount - 1) } })} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground">-</button>
                  <span className="w-4 text-center font-bold text-sm">{state.tableCount}</span>
                  <button onClick={() => dispatch({ type: "SET_FIELD", payload: { field: "tableCount", value: state.tableCount + 1 } })} className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">+</button>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <input type="checkbox" checked={state.addWaterBoiler} onChange={e => dispatch({ type: "SET_FIELD", payload: { field: "addWaterBoiler", value: e.target.checked } })} className="w-5 h-5 accent-secondary" />
                <div>
                  <div className="text-sm font-bold">Water boiler 500 watt</div>
                  <div className="text-xs text-foreground/60">Ceklis apabila memilih menu mie kuah</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Step 4: Data & Alamat */}
        <div className={`transition-all duration-700 ease-out origin-top ${!isValidAmount ? 'opacity-30 pointer-events-none scale-95 blur-[1px]' : 'opacity-100 scale-100 blur-0'}`}>
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">4</span> Detail PIC & Lokasi Acara</h2>

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
            <h2 className="text-xl font-extrabold mb-2">Ringkasan Total Pesanan</h2>

            <div className="space-y-3 text-sm text-foreground/80 mb-6 pb-6 border-b border-card-border relative z-10">
              {selectedPkg && (
                <div className="flex justify-between items-center text-foreground font-bold text-sm sm:text-base">
                  <span>Paket : {selectedPkg.name} {selectedPkg.portions} porsi</span>
                  <span>{formatRupiah(state.calculations.basePrice)}</span>
                </div>
              )}
              {state.calculations.extraPackagePrice > 0 && selectedPkg && (
                <div className="flex justify-between items-center text-foreground font-bold text-sm sm:text-base mt-1">
                  <span>
                    Pesanan Tambahan : {state.calculations.extraPackagePorsi} Porsi
                    <span className="text-xs font-normal text-foreground/60 ml-2">
                      (x Rp {(selectedPkg.price / selectedPkg.portions).toLocaleString("id-ID")})
                    </span>
                  </span>
                  <span>Rp {state.calculations.extraPackagePrice.toLocaleString("id-ID")}</span>
                </div>
              )}
              {state.calculations.extraToppingPrice > 0 && (
                <div className="flex justify-between items-center text-foreground/80 italic mt-1">
                  <span>Tambahan Extra Topping di Luar Paket</span>
                  <span className="font-bold">Rp {state.calculations.extraToppingPrice.toLocaleString("id-ID")}</span>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-card-border">
                <h3 className="font-bold text-base mb-3">Menu</h3>

                {/* Mie Section */}
                <div className="mb-4">
                  <span className="font-bold text-sm text-foreground/80 block mb-1">Mie:</span>
                  {state.mie.length === 0 || !state.mie.some(item => Number(item.qty) > 0) ? (
                    <div className="text-sm pl-2 text-red-500 italic">Belum ada varian mie yang dipilih</div>
                  ) : (
                    state.mie.map(item => item.name && Number(item.qty) > 0 ? (
                      <div key={item.id} className="text-sm pl-2 text-foreground/80">
                        - {item.name} {item.qty} Porsi
                      </div>
                    ) : null)
                  )}
                </div>

                {/* Topping Section */}
                {selectedPkg && selectedPkg.name !== "Mie tanpa Topping" && (
                  <div className="mb-4">
                    <span className="font-bold text-sm text-foreground/80 block mb-1">Topping:</span>
                    {(state.toppingReg || []).every(item => !item.name || Number(item.qty) === 0) &&
                      (state.toppingReg2 || []).every(item => !item.name || Number(item.qty) === 0) &&
                      (state.toppingPrem || []).every(item => !item.name || Number(item.qty) === 0) &&
                      (state.toppingSuper || []).every(item => !item.name || Number(item.qty) === 0) ? (
                      <div className="text-sm pl-2 text-red-500 italic">Belum ada topping yang dipilih (Wajib diisi sesuai paket)</div>
                    ) : (
                      <>
                        {(state.toppingReg || []).map(item => item.name && Number(item.qty) > 0 ? (
                          <div key={item.id} className="text-sm pl-2 text-foreground/80">
                            - {item.name} {item.qty} Porsi
                          </div>
                        ) : null)}
                        {(state.toppingReg2 || []).map(item => item.name && Number(item.qty) > 0 ? (
                          <div key={item.id} className="text-sm pl-2 text-foreground/80">
                            - {item.name} {item.qty} Porsi
                          </div>
                        ) : null)}
                        {/* Show auto-filled pendamping */}
                        {selectedPkg && (selectedPkg.name === "Paket Odeng" || selectedPkg.name.includes("Komplit")) && (
                          <>
                            <div className="text-sm pl-2 text-foreground/80">- Cheese Dumpling {Math.max(totalTopPrem, selectedPkg.portions)} Porsi</div>
                            <div className="text-sm pl-2 text-foreground/80">- Chicken Dumpling {Math.max(totalTopPrem, selectedPkg.portions)} Porsi</div>
                          </>
                        )}
                        {(state.toppingPrem || []).map(item => item.name && Number(item.qty) > 0 ? (
                          <div key={item.id} className="text-sm pl-2 text-foreground/80">
                            - {item.name} {item.qty} Porsi
                          </div>
                        ) : null)}
                        {(state.toppingSuper || []).map(item => item.name && Number(item.qty) > 0 ? (
                          <div key={item.id} className="text-sm pl-2 text-foreground/80">
                            - {item.name} {item.qty} Porsi
                          </div>
                        ) : null)}
                      </>
                    )}
                  </div>
                )}
              </div>
              {state.calculations.extraFee > 0 && (
                <>
                  <div className="flex justify-between items-center text-foreground/80">
                    <span>Peralatan Tambahan</span>
                    <span className="font-bold text-foreground">Rp {state.calculations.extraFee.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="pl-4 space-y-0.5 mb-2">
                    {state.komporType === "Kompor Gas portable HiCook" && (
                      <div className="text-[11px] text-foreground/60 flex justify-between">
                        <span>- Kompor Gas portable HiCook</span>
                        <span>Rp 100.000</span>
                      </div>
                    )}
                    {state.tableCount > 0 && (
                      <div className="text-[11px] text-foreground/60 flex justify-between">
                        <span>- Sewa Meja ({state.tableCount} unit)</span>
                        <span>Rp {(state.tableCount * 100000).toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    {state.packageId === "reguler" && state.stallType === "gerobak" && (
                      <div className="text-[11px] text-foreground/60 flex justify-between">
                        <span>- Sewa Gerobak</span>
                        <span>Rp 250.000</span>
                      </div>
                    )}
                    {state.addWaterBoiler && (
                      <div className="text-[11px] text-foreground/60 flex justify-between">
                        <span>- Water Boiler 500 Watt</span>
                        <span>(Free)</span>
                      </div>
                    )}
                  </div>
                </>
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

export default function WeddingBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-foreground/50">Memuat Formulir...</div>}>
      <WeddingBookingContent />
    </Suspense>
  );
}
