"use client";

import { useBooking, BookingProvider } from "@/context/BookingContext";
import { OrderSummary } from "@/components/catering/wizard/OrderSummary";
import { Step1Profile } from "@/components/catering/wizard/Step1Profile";
import { Step2Location } from "@/components/catering/wizard/Step2Location";
import { Step3Stall } from "@/components/catering/wizard/Step3Stall";
import { Step4Menu } from "@/components/catering/wizard/Step4Menu";
import { Step5Checkout } from "@/components/catering/wizard/Step5Checkout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const steps = [
  { id: 1, title: "Profil & Acara" },
  { id: 2, title: "Waktu & Lokasi" },
  { id: 3, title: "Setup Stall" },
  { id: 4, title: "Pilih Menu" },
  { id: 5, title: "Checkout" }
];

function BookingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const { state } = useBooking();

  const handleNext = () => {
    // Local validation logic per step before advancing
    if (currentStep === 1) {
      if (!state.name || !state.whatsapp || !state.eventType) {
        alert("Lengkapi data Nama, WhatsApp, dan Acara dulu ya!");
        return;
      }
    } else if (currentStep === 2) {
      if (!state.city || !state.address || !state.date || !state.time) {
        alert("Lengkapi Kota Asal, Alamat, Tanggal dan Jam Acara!");
        return;
      }
      if (state.distanceKm === 0) {
        alert("Silakan pilih alamat dari dropdown Google Maps agar kami bisa menghitung jarak transport.");
        return;
      }
    } else if (currentStep === 3) {
      if (!state.stallType) {
        alert("Pilih jenis Stall (Gerobak / Booth) dulu.");
        return;
      }
    } else if (currentStep === 4) {
      if (!state.packageId) {
        alert("Silakan pilih Paket Terlebih Dahulu.");
        return;
      }
      if (state.packageId === "reguler" && !state.calculations.isValidReguler) {
        alert(`Minimum order Paket Reguler Rp 700.000. Saat ini masih kurang Rp ${(700000 - state.calculations.basePrice - state.calculations.extraPrice).toLocaleString("id-ID")}`);
        return;
      }
      if (state.calculations.totalPorsi === 0) {
        alert("Silakan isi minimal 1 Porsi Mie.");
        return;
      }
    }

    if (currentStep < 5) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentStep(s => s - 1);
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold mb-3">Booking Mienian Catering ✨</h1>
          <p className="text-foreground/60 max-w-xl mx-auto">
            Isi form step-by-step di bawah ini. Tenang, total biayanya kelihatan transparan di sebelah kanan.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="mb-10 border-b border-card-border pb-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center min-w-[600px] justify-between max-w-4xl mx-auto">
            {steps.map((step, idx) => (
              <div key={step.id} className={`flex items-center ${idx !== 0 ? 'flex-1' : ''}`}>
                {idx !== 0 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${currentStep >= step.id ? 'bg-primary' : 'bg-card-border'}`} />
                )}
                <div className={`flex flex-col items-center gap-2 transition-all ${currentStep === step.id ? 'opacity-100 scale-110' : currentStep > step.id ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    currentStep > step.id ? "bg-primary text-white" :
                    currentStep === step.id ? "bg-primary text-white border-4 border-primary/30" :
                    "bg-card-border text-foreground/50"
                  }`}>
                    {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${currentStep >= step.id ? 'text-primary' : 'text-foreground/50'}`}>
                    {step.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          
          {/* Left: Active Wizard Step */}
          <div className="flex-1 w-full min-h-[50vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="card p-6 sm:p-8"
              >
                {currentStep === 1 && <Step1Profile />}
                {currentStep === 2 && <Step2Location />}
                {currentStep === 3 && <Step3Stall />}
                {currentStep === 4 && <Step4Menu />}
                {currentStep === 5 && <Step5Checkout />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between">
              {currentStep > 1 ? (
                <button onClick={handleBack} type="button" className="btn btn-outlined btn-md flex gap-2 items-center">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
              ) : (
                <Link href="/catering" className="btn btn-outlined btn-md text-foreground/50 hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" /> Back to Info
                </Link>
              )}
              
              {currentStep < 5 && (
                <button onClick={handleNext} type="button" className="btn btn-primary btn-lg flex gap-2 items-center px-8 shadow-primary/25">
                  Selanjutnya
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Sticky Order Summary */}
          <div className="w-full lg:w-[350px] shrink-0">
            <OrderSummary />
          </div>

        </div>
      </div>
    </div>
  );
}

// Ensure BookingProvider is wrapping the wizard, even though RootLayout has it.
// This is to prevent overlapping context issues if needed, but RootLayout has it globally.
// We will just export the component.
export default BookingWizard;
