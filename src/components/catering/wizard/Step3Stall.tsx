"use client";

import { useBooking, StallType } from "@/context/BookingContext";
import { Store, ShoppingCart, CheckCircle2, Flame, Tent } from "lucide-react";

export function Step3Stall() {
  const { state, dispatch } = useBooking();

  const handleStall = (type: StallType) => {
    dispatch({ type: "SET_FIELD", payload: { field: "stallType", value: type } });
  };

  const setKompor = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      dispatch({ type: "SET_FIELD", payload: { field: "komporType", value: "" } });
      dispatch({ type: "SET_FIELD", payload: { field: "komporPrice", value: 0 } });
      return;
    }
    const [price, name] = val.split("|");
    dispatch({ type: "SET_FIELD", payload: { field: "komporType", value: name } });
    dispatch({ type: "SET_FIELD", payload: { field: "komporPrice", value: Number(price) } });
  };

  // derived value for select
  const currentKomporVal = state.komporType ? `${state.komporPrice}|${state.komporType}` : "";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold mb-1">Visual Venue & Alat 🛠️</h2>
        <p className="text-foreground/60 text-sm">Pilih jenis *stall* yang paling cocok buat *vibe* acara lo.</p>
      </div>

      <div className="space-y-6">
        
        {/* Stall Types */}
        <div>
          <label className="block text-sm font-semibold mb-3">Pilihan Stall <span className="text-primary">*</span></label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Booth */}
            <button
              onClick={() => handleStall("booth")}
              className={`relative flex flex-col p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
                state.stallType === "booth"
                  ? "bg-primary/5 border-primary shadow-sm"
                  : "bg-card border-card-border hover:border-primary/40"
              }`}
            >
              {state.stallType === "booth" && (
                 <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-primary" />
              )}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${state.stallType === "booth" ? "bg-primary text-white" : "bg-muted text-foreground/50"}`}>
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-1">Booth Portable</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Minimalis, bisa masuk indoor (ruko/gedung) dengan mudah. Space efisien.
              </p>
            </button>

            {/* Gerobak */}
            <button
              onClick={() => handleStall("gerobak")}
              className={`relative flex flex-col p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
                state.stallType === "gerobak"
                  ? "bg-primary/5 border-primary shadow-sm"
                  : "bg-card border-card-border hover:border-primary/40"
              }`}
            >
              {state.stallType === "gerobak" && (
                 <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-primary" />
              )}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${state.stallType === "gerobak" ? "bg-primary text-white" : "bg-muted text-foreground/50"}`}>
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-1">Gerobak Autentik</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Visiual *street-food* abis. Lebih makan space, cocok buat outdoor.
              </p>
              <div className="mt-3 py-1.5 px-3 bg-tertiary/10 text-tertiary rounded-lg text-xs font-bold self-start">
               Gratis buat Paket Jadi (Selain Reguler)
              </div>
            </button>
          </div>
        </div>

        {/* Alat Tambahan */}
        <div className="bg-muted/50 rounded-2xl p-5 border border-card-border">
           <h3 className="font-bold text-md mb-4 flex items-center gap-2">
             <Tent className="w-5 h-5 text-foreground/50" /> Extra Peralatan (Opsional)
           </h3>

           <div className="space-y-4">
              {/* Kompor */}
              <div>
                <label className="block text-sm font-semibold mb-2">Kompor Tambahan</label>
                <div className="relative">
                  <Flame className="absolute top-3.5 left-3 w-5 h-5 text-foreground/40 pointer-events-none" />
                  <select
                    value={currentKomporVal}
                    onChange={setKompor}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-transparent focus:border-primary focus:outline-none transition-colors appearance-none text-sm"
                  >
                    <option value="">-- Tanpa Tambahan Kompor --</option>
                    <option value="100000|Kompor Gas Portable">Kompor Gas Portable (+ Rp 100.000)</option>
                    <option value="0|Kompor Gas + Tabung 3Kg">Kompor Gas + Tabung 3Kg (Gratis)</option>
                    <option value="0|Kompor Gas + Tabung 5Kg">Kompor Gas + Tabung 5Kg (Gratis)</option>
                    <option value="0|Kompor Listrik (400 watt/kompor)">Kompor Listrik 400w (Gratis)</option>
                  </select>
                </div>
                {state.komporType?.includes("Listrik") && (
                  <p className="text-xs text-primary font-medium mt-1">
                    *Catatan: 150 porsi menggunakan 2 kompor listrik. Kelipatan 100 tambah 1 kompor.
                  </p>
                )}
              </div>

              {/* Meja */}
              <div>
                <label className="flex items-start gap-4 p-4 rounded-xl border border-card-border bg-card cursor-pointer hover:border-primary/50 transition-colors">
                   <div className="flex items-center h-5">
                      <input 
                        type="checkbox" 
                        checked={state.tableCount > 0}
                        onChange={(e) => dispatch({ type: "SET_FIELD", payload: { field: "tableCount", value: e.target.checked ? 1 : 0 } })}
                        className="w-5 h-5 rounded border-card-border accent-primary focus:ring-primary focus:ring-2" 
                      />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">Meja Serving Lipat (+ Rp 100.000)</span>
                      <span className="text-xs text-foreground/50 mt-1">Tambahan penyewaan meja lipat apabila venue tidak ada fasilitas dudukan / meja bawaan untuk naruh mangkok.</span>
                   </div>
                </label>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
