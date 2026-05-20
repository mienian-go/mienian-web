"use client";

import { useBooking, PaymentType } from "@/context/BookingContext";
import { formatRupiah } from "@/data/menu";
import { CreditCard, Percent, Send, Loader2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { createOrder, updateUserProfile, getUserProfile } from "@/lib/firestore";

export function Step5Checkout() {
  const { state, dispatch } = useBooking();
  const c = state.calculations;
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  // Auth
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Payment method preference: "doku" | "manual"
  const [paymentMethod, setPaymentMethod] = useState<"doku" | "manual">("doku");

  // Payment settings from Firestore
  const [paymentSettings, setPaymentSettings] = useState<{ dokuEnabled: boolean; manualEnabled: boolean }>({ dokuEnabled: true, manualEnabled: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch payment settings from Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "global"));
        if (snap.exists()) {
          const data = snap.data();
          setPaymentSettings({
            dokuEnabled: data.dokuEnabled ?? true,
            manualEnabled: data.enableManualPayment ?? true,
          });
          // Auto-select available method
          if ((data.dokuEnabled ?? true) && !(data.enableManualPayment ?? true)) setPaymentMethod("doku");
          else if (!(data.dokuEnabled ?? true) && (data.enableManualPayment ?? true)) setPaymentMethod("manual");
        }
      } catch (err) {
        console.warn("Could not fetch payment settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handlePayment = (type: PaymentType) => {
    dispatch({ type: "SET_FIELD", payload: { field: "paymentType", value: type } });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isLoginMode) {
        const userCredential = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        const userProfile = await getUserProfile(userCredential.user.uid);
        if (!userProfile) {
          await auth.signOut();
          setAuthError("Email ini terdaftar sebagai Affiliate. Silakan gunakan email lain.");
          return;
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await updateUserProfile(userCredential.user.uid, {
          email: authEmail,
          name: state.name,
          whatsapp: state.whatsapp,
        });
      }
      setShowAuthModal(false);
      proceedToOrder();
    } catch (err: any) {
      setAuthError(err.message || "Gagal Autentikasi");
    }
  };

  const handleSubmit = async () => {
    if (paymentMethod === "doku") {
      // Need auth for DOKU
      if (currentUser) {
        proceedToOrder();
      } else {
        setShowAuthModal(true);
      }
    } else {
      // Manual bank transfer → go to confirm page
      setSubmitting(true);
      setTimeout(() => {
        router.push("/stall/confirm");
      }, 600);
    }
  };

  const proceedToOrder = async () => {
    setSubmitting(true);
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
        totalPorsi: c.totalPorsi,
        stallType: state.stallType,
        komporType: state.komporType,
        tableCount: state.tableCount,
        addWaterBoiler: state.addWaterBoiler,
        packageId: state.packageId,
        packageName: state.packageId === "reguler" ? "Reguler (A la carte)" : (state.packages.find(p => p.id === state.packageId)?.name || ""),
        items: {
          mie: state.mie,
          toppingReg: state.toppingReg,
          toppingPrem: state.toppingPrem,
          toppingSuper: state.toppingSuper || [],
          odeng: state.odeng,
        },
        costs: c,
        promoCode: state.appliedPromo ? state.appliedPromo.code : null,
        promoDiscount: c.promoDiscountAmount || 0,
        affiliateCode: state.affiliateCode || "",
        status: "pending_payment",
        paymentMethod: "doku",
        orderType: state.eventType === "Wedding" ? "wedding" : "catering",
      };

      const orderId = await createOrder(orderData);

      // Increment promo usage
      if (state.appliedPromo) {
        try {
          await updateDoc(doc(db, "promos", state.appliedPromo.id), {
            usageCount: increment(1)
          });
        } catch (err) {
          console.error("Failed to increment promo usage", err);
        }
      }

      // Call DOKU
      try {
        const apiBase = process.env.NEXT_PUBLIC_BASE_URL || "https://mienian-web.vercel.app";
        const dokuRes = await fetch(`${apiBase}/api/doku/create-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            amount: state.paymentType === "dp" ? c.payNow : c.grandTotal,
            customerName: state.name,
            customerEmail: auth.currentUser?.email || "",
            invoiceNumber: `MIENIAN-${orderId}`,
          }),
        });
        const dokuData = await dokuRes.json();

        if (dokuData.paymentUrl) {
          window.location.href = dokuData.paymentUrl;
          return;
        }
      } catch (dokuErr) {
        console.warn("DOKU payment failed, falling back to manual:", dokuErr);
      }

      // Fallback
      router.push(`/payment?id=${orderId}`);
    } catch (error: any) {
      const msg = error?.message || error?.code || "Unknown error";
      alert(`Gagal membuat order:\n${msg}`);
      console.error("Order creation error:", error);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
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
              <button type="submit" disabled={submitting} className="w-full py-4 bg-primary text-white font-bold rounded-xl mt-2">{submitting ? "Memproses..." : isLoginMode ? "Masuk & Lanjutkan" : "Daftar & Lanjutkan"}</button>
            </form>
            <div className="mt-6 text-center text-xs">
              {isLoginMode ? "Belum punya akun? " : "Sudah punya akun? "}
              <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-primary font-bold">{isLoginMode ? "Daftar di sini" : "Login di sini"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-1">Pilih Metode Pembayaran 💳</h2>
        <p className="text-foreground/60 text-sm">Validasi order lo sebelum lanjut bayar.</p>
      </div>

      <div className="space-y-6">
        
        {/* Payment Type: Full vs DP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Full Payment */}
          <button
            onClick={() => handlePayment("full")}
            className={`relative flex flex-col p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
              state.paymentType === "full"
                ? "bg-primary/5 border-primary shadow-sm"
                : "bg-card border-card-border hover:border-primary/40"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${state.paymentType === "full" ? "bg-primary text-white" : "bg-muted text-foreground/50"}`}>
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-1">Full Payment</h3>
            <p className="text-sm text-foreground/60 leading-relaxed mb-3">
              Lunas di awal. Gak perlu pusing bayar sisa tagihan pas H-1 acara.
            </p>
            {state.packageId !== "reguler" && (
                <div className="py-1.5 px-3 bg-tertiary/10 text-tertiary rounded-lg text-xs font-bold self-start animate-pulse">
                  🎁 Bonus: Bebas Biaya Petugas Server
                </div>
            )}
            <div className="mt-3 text-lg font-bold text-primary">
              {formatRupiah(c.grandTotal)}
            </div>
          </button>

          {/* DP 50% */}
          <button
            onClick={() => handlePayment("dp")}
            disabled={!c.isDpAllowed}
            className={`relative flex flex-col p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
              !c.isDpAllowed ? "opacity-50 cursor-not-allowed bg-muted border-card-border" :
              state.paymentType === "dp"
                ? "bg-primary/5 border-primary shadow-sm"
                : "bg-card border-card-border hover:border-primary/40"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${state.paymentType === "dp" ? "bg-primary text-white" : "bg-muted text-foreground/50"}`}>
              <Percent className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-1">DP 50%</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
               Bayar separuh dulu untuk *lock* / mengunci slot tanggal {state.date ? encodeURI(new Date(state.date).toLocaleDateString("id-ID")) : "acara kalian"}.
            </p>
            {!c.isDpAllowed ? (
                <div className="mt-3 py-1.5 px-3 bg-primary/10 text-primary rounded-lg text-xs font-bold self-start border border-primary/20">
                  ⚠️ H-30 hari wajib Full Payment
                </div>
            ) : (
                <div className="mt-auto pt-3 text-lg font-bold text-primary">
                  {formatRupiah(Math.ceil(c.grandTotal * 0.5))} <span className="text-xs text-foreground/50 font-normal">Sisa H-30</span>
                </div>
            )}
          </button>
        </div>

        {/* Payment Method: DOKU vs Manual */}
        {(paymentSettings.dokuEnabled || paymentSettings.manualEnabled) && (
          <div>
            <label className="block text-sm font-semibold mb-3">Cara Bayar</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentSettings.dokuEnabled && (
                <button
                  onClick={() => setPaymentMethod("doku")}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === "doku" ? "bg-primary/5 border-primary" : "bg-card border-card-border hover:border-primary/40"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "doku" ? "bg-primary text-white" : "bg-muted text-foreground/50"}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">DOKU Payment</p>
                    <p className="text-[11px] text-foreground/50">VA, QRIS, E-Wallet, dll</p>
                  </div>
                </button>
              )}
              {paymentSettings.manualEnabled && (
                <button
                  onClick={() => setPaymentMethod("manual")}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === "manual" ? "bg-primary/5 border-primary" : "bg-card border-card-border hover:border-primary/40"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "manual" ? "bg-primary text-white" : "bg-muted text-foreground/50"}`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Transfer Manual</p>
                    <p className="text-[11px] text-foreground/50">BSI / QRIS + Upload bukti</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Auth Status */}
        {paymentMethod === "doku" && (
          <div className={`p-4 rounded-xl text-sm ${currentUser ? "bg-green-500/10 border border-green-500/20 text-green-700" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-700"}`}>
            {isAuthLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Mengecek status login...</span>
            ) : currentUser ? (
              <span>✅ Login sebagai <strong>{currentUser.email}</strong></span>
            ) : (
              <span>⚠️ Anda belum login. Sistem akan meminta login saat klik Checkout.</span>
            )}
          </div>
        )}

        {/* Final CTA Action */}
        <div className="pt-6 border-t border-card-border/50 text-center">
             <button
                onClick={handleSubmit} 
                className="btn btn-primary btn-lg flex items-center gap-2 mx-auto disabled:opacity-75 disabled:cursor-not-allowed shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
                disabled={submitting}
             >
                {submitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Memproses Data...</span>
                ) : paymentMethod === "doku" ? (
                  <>Checkout & Bayar via DOKU <Send className="w-5 h-5 ml-1" /></>
                ) : (
                  <>Konfirmasi & Lanjut Upload Struk <Send className="w-5 h-5 ml-1" /></>
                )}
             </button>
             <p className="mt-4 text-xs text-foreground/40 max-w-sm mx-auto">
               Dengan menekan tombol, lo setuju sama T&C Mienian Stall. 
               Data event lo udah direkam otomatis secara draft oleh sistem Mienian.
             </p>
        </div>

      </div>
    </div>
  );
}
