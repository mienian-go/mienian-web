"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoCart } from "@/context/GoCartContext";
import { ArrowLeft, ArrowRight, MapPin, Phone, User, Clock, CheckCircle2, Rocket, Loader2, ShoppingCart, ShieldCheck, Bike, Package, Navigation } from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/data/menu";
import { useAuth } from "@/context/AuthContext";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];

const KOTA_ORIGIN: Record<string, { label: string, disabled?: boolean }> = {
  Jakarta: { label: "Jakarta" },
  Bandung: { label: "Bandung (Coming Soon)", disabled: true },
  Yogyakarta: { label: "Yogyakarta (Coming Soon)", disabled: true }
};

const SERVICE_FEE = 3000;

export default function CheckoutPage() {
  const { state, dispatch, totalPrice, totalItems } = useGoCart();
  const { user } = useAuth();
  const [city, setCity] = useState<string>("Jakarta");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBgj6aPrkcd-B2lWsE0_AdA8PQpbO13R7c",
    libraries,
  });

  const isPickup = state.orderMode === "pickup";
  const deliveryFee = 0; // Bebas ongkir!
  const grandTotal = totalPrice + deliveryFee + SERVICE_FEE;

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        dispatch({ type: "SET_DELIVERY_DETAILS", payload: { address: place.formatted_address } });
      }
    }
  };

  const onLoad = (autocompleteInst: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInst);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi.");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!window.google) {
          setIsDetectingLocation(false);
          return;
        }
        const geocoder = new google.maps.Geocoder();
        const latlng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        geocoder.geocode({ location: latlng }, (results, status) => {
          setIsDetectingLocation(false);
          if (status === "OK" && results && results[0]) {
            dispatch({ type: "SET_DELIVERY_DETAILS", payload: { address: results[0].formatted_address } });
          } else {
            alert("Gagal mendeteksi alamat dari koordinat.");
          }
        });
      },
      (error) => {
        setIsDetectingLocation(false);
        alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.");
      }
    );
  };

  const handleCheckout = async () => {
    if (!state.customerName || !state.whatsapp) {
      alert("Harap lengkapi Nama dan WhatsApp.");
      return;
    }
    if (!isPickup && !state.address) {
      alert("Harap lengkapi Alamat Pengiriman.");
      return;
    }
    if (!isPickup && state.distanceKm > 1) {
      alert("Alamat pengiriman di luar jangkauan. Maksimal jarak pengiriman adalah 1 KM dari KangDoMie.");
      return;
    }

    if (!state.driverId) {
      alert("Kamu belum memilih KangDoMie. Silakan kembali ke menu dan pilih KangDoMie di peta.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Verify driver is still active
      const { getDoc, doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
      const [driverSnap, locSnap] = await Promise.all([
        getDoc(doc(db, "kangdomie_drivers", state.driverId)),
        getDoc(doc(db, "kangdomie_locations", state.driverId))
      ]);
      
      if (!driverSnap.exists() || !locSnap.exists()) {
        alert("Maaf, KangDoMie yang Anda pilih tidak ditemukan. Silakan kembali ke peta dan pilih KangDoMie lain.");
        setIsSubmitting(false);
        return;
      }

      const driverData = driverSnap.data();
      const locData = locSnap.data();

      if (!driverData.isOnline || locData.status !== "available") {
        alert("Maaf, KangDoMie yang Anda pilih saat ini sudah offline atau sedang mengantar pesanan lain. Silakan kembali ke peta dan pilih KangDoMie lain.");
        setIsSubmitting(false);
        return;
      }

      if (driverData.isCooking) {
        const confirmWait = window.confirm(
          "KangDoMie yang Anda pilih sedang sibuk memasak pesanan pembeli di tempat.\n\nPesanan Anda mungkin akan sedikit tertunda. Apakah Anda ingin TETAP PESAN & MENUNGGU?\n\n(Klik OK untuk tetap pesan, atau Cancel untuk cari KangDoMie lain)"
        );
        if (!confirmWait) {
          setIsSubmitting(false);
          return;
        }
      }

      const orderId = `GO${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 999)}`;
      
      const res = await fetch("/api/doku/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId,
          amount: grandTotal,
          customerName: state.customerName,
          customerEmail: "no-email@mienian.id",
          invoiceNumber: `INV-${orderId}-${Date.now().toString().slice(-6)}`,
          callbackUrl: `${window.location.origin}/mienian-go/tracking/${orderId}`,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pembayaran Doku");
      
      await setDoc(doc(db, "orders", orderId), {
        orderId,
        source: "mienian_go",
        orderType: isPickup ? "pickup" : "delivery",
        orderMode: state.orderMode,
        userId: user?.uid || null,
        customerName: state.customerName,
        whatsapp: state.whatsapp,
        city: city,
        address: isPickup ? `Pickup — ${city}` : state.address,
        distanceKm: isPickup ? 0 : state.distanceKm,
        driverId: state.driverId || null,
        driverName: state.driverName || null,
        items: state.items,
        costs: {
          subtotal: totalPrice,
          deliveryFee: deliveryFee,
          serviceFee: SERVICE_FEE,
          grandTotal: grandTotal,
        },
        status: "pending_payment",
        createdAt: new Date(),
      });

      dispatch({ type: "CLEAR_CART" });

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("URL pembayaran tidak ditemukan");
      }
    } catch (err: any) {
      alert("Gagal memproses Checkout: " + err.message);
      setIsSubmitting(false);
    }
  };

  if (totalItems === 0 && !isSubmitting) {
    return (
      <div className="min-h-screen pt-32 pb-24 flex flex-col items-center justify-center">
        <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Keranjang Kosong</h2>
        <p className="text-foreground/60 mb-6 text-center max-w-sm">
          Kamu belum memilih menu apapun. Yuk pesan mie hangatnya sekarang!
        </p>
        <Link href="/mienian-go" className="btn btn-primary">
          Lihat Menu Mienian GO
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-32 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/mienian-go" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Menu
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold mb-8">
          Checkout <span className="gradient-text">{isPickup ? "Pickup" : "Delivery"}</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT COLUMN: FORM */}
          <div className="flex-1 space-y-6">
            {/* Order Type Toggle */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_DELIVERY_DETAILS", payload: { orderMode: "delivery" } })}
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  !isPickup ? "border-primary bg-primary/10 text-primary" : "border-white/10 hover:bg-white/5"
                }`}
              >
                <Rocket className="w-6 h-6" />
                <span className="font-bold text-sm">Delivery Cepat</span>
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_DELIVERY_DETAILS", payload: { orderMode: "pickup" } })}
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  isPickup ? "border-primary bg-primary/10 text-primary" : "border-white/10 hover:bg-white/5"
                }`}
              >
                <Package className="w-6 h-6" />
                <span className="font-bold text-sm">Self Pickup</span>
              </button>
            </div>

            {!isPickup && (
              <div className="mt-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <p className="text-sm font-bold text-orange-500 mb-1 flex items-center gap-2">
                  <Bike className="w-4 h-4" /> Driver KangDoMie
                </p>
                {state.driverName ? (
                  <p className="text-xs text-foreground/70">Memanggil: <strong className="text-foreground">{state.driverName}</strong></p>
                ) : (
                  <p className="text-xs text-orange-400">Anda belum memilih KangDoMie. Silakan kembali ke peta dan pilih KangDoMie terdekat.</p>
                )}
              </div>
            )}

            <div className="card p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="text-primary w-5 h-5" /> {isPickup ? "Data Pemesan" : "Kontak & Pengiriman"}
              </h2>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      value={state.customerName}
                      onChange={(e) => dispatch({ type: "SET_DELIVERY_DETAILS", payload: { customerName: e.target.value } })}
                      placeholder="Misal: Budi"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nomor WhatsApp</label>
                    <input
                      type="tel"
                      value={state.whatsapp}
                      onChange={(e) => dispatch({ type: "SET_DELIVERY_DETAILS", payload: { whatsapp: e.target.value } })}
                      placeholder="08123456789"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {isPickup ? (
                  /* Pickup Mode */
                  <div className="p-5 rounded-xl bg-secondary/5 border border-secondary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Samperin gerobak terdekat!</p>
                        <p className="text-xs text-foreground/50">Pesanan akan disiapkan, kamu tinggal ambil di gerobak</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Delivery Mode */
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold">Alamat Pengiriman (Bisa Diketik & Auto-detect)</label>
                        <button
                          type="button"
                          onClick={detectLocation}
                          disabled={!isLoaded || isDetectingLocation}
                          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          {isDetectingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                          Gunakan Lokasi Saat Ini
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <MapPin className="w-5 h-5 text-foreground/40" />
                        </div>
                        {isLoaded ? (
                          <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                            <input
                              type="text"
                              value={state.address}
                              onChange={(e) => dispatch({ type: "SET_DELIVERY_DETAILS", payload: { address: e.target.value } })}
                              placeholder="Ketik alamat atau gunakan tombol auto-detect..."
                              className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors"
                              required
                            />
                          </Autocomplete>
                        ) : (
                          <input
                            type="text"
                            placeholder="Loading Maps..."
                            disabled
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-transparent opacity-50 cursor-not-allowed"
                          />
                        )}
                      </div>
                      <div className="mt-2">
                        <motion.p 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-xs text-secondary font-extrabold flex items-center gap-1"
                        >
                          🎉 GRATIS ONGKIR DENGAN JARAK MAKSIMAL 1KM
                        </motion.p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="card p-6 sm:p-8 sticky top-24">
              <h3 className="font-extrabold text-xl mb-6">Ringkasan Pesanan</h3>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                {state.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4 border-b border-card-border pb-4 last:border-0 last:pb-0">
                    <div>
                      <h4 className="font-bold text-sm">{item.name}</h4>
                      <p className="text-xs text-foreground/60">{item.quantity}x {formatRupiah(item.price)}</p>
                    </div>
                    <p className="font-bold text-sm">{formatRupiah(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-dashed border-card-border">
                <div className="flex justify-between text-sm text-foreground/70">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground">{formatRupiah(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-foreground/70">
                  <span>{isPickup ? "Ongkos Kirim" : "Ongkos Kirim"}</span>
                  {isPickup ? (
                    <span className="font-bold text-green-500">GRATIS</span>
                  ) : (
                    <span className="font-bold text-green-500">🎉 GRATIS</span>
                  )}
                </div>
                <div className="flex justify-between text-sm text-foreground/70">
                  <span>Biaya Layanan</span>
                  <span className="font-bold text-foreground">{formatRupiah(SERVICE_FEE)}</span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-card-border">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-extrabold text-lg">Total</span>
                  <span className="font-extrabold text-2xl text-primary">{formatRupiah(grandTotal)}</span>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCheckout}
                  disabled={isSubmitting || (!isPickup && !state.driverId)}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 mt-8"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Memproses...
                    </span>
                  ) : (
                    "Gas, Bayar! 🔥"
                  )}
                </motion.button>
                <p className="text-xs text-center text-foreground/50 mt-4 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Pembayaran Aman & Otomatis via DOKU
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
