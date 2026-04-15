"use client";

import { useBooking, PaymentType } from "@/context/BookingContext";
import { formatRupiah } from "@/data/menu";
import { CreditCard, Percent, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Step5Checkout() {
  const { state, dispatch } = useBooking();
  const c = state.calculations;
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handlePayment = (type: PaymentType) => {
    dispatch({ type: "SET_FIELD", payload: { field: "paymentType", value: type } });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // In a real application, you might save this draft to Firebase before navigating.
    // For now, we will simply proceed to the confirmation page to upload the receipt.
    // The ConfirmPage will read from BookingContext instead of CartContext.
    setTimeout(() => {
       router.push("/catering/confirm");
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-1">Pilih Metode Pembayaran 💳</h2>
        <p className="text-foreground/60 text-sm">Validasi order lo sebelum lanjut upload bukti transfer.</p>
      </div>

      <div className="space-y-6">
        
        {/* Payment Options */}
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

        {/* Final CTA Action */}
        <div className="pt-6 border-t border-card-border/50 text-center">
             <button
                onClick={handleSubmit} 
                className="btn btn-primary btn-lg flex items-center gap-2 mx-auto disabled:opacity-75 disabled:cursor-not-allowed shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
                disabled={submitting}
             >
                {submitting ? "Memproses Data..." : "Konfirmasi & Lanjut Upload Struk"}
                <Send className="w-5 h-5 ml-1" />
             </button>
             <p className="mt-4 text-xs text-foreground/40 max-w-sm mx-auto">
               Dengan menekan tombol, lo setuju sama T&C Mienian Catering. 
               Data event lo udah direkam otomatis secara draft oleh sistem Mienian.
             </p>
        </div>

      </div>
    </div>
  );
}
