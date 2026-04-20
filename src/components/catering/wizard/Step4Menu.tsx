"use client";

import { useBooking, LineItem } from "@/context/BookingContext";
import { cateringPackages } from "@/data/menu";
import { CopyPlus, Trash2, Soup, Gem, FishSymbol, UtensilsCrossed } from "lucide-react";
import { useEffect } from "react";

const DAFTAR_MIE = [
  "Indomie Goreng Original", "Indomie Goreng Rendang", "Indomie Goreng Ayam geprek",
  "Indomie Goreng Aceh", "Indomie Kari Ayam", "Indomie Soto",
  "Indomie Ayam Spesial", "Indomie Ayam Bawang", "Indomie Seblak", "Indomie Banglades'e"
];

const DAFTAR_TOPPING_REG = ["Baso Sapi (1 pc)", "Baso Salmon (1 pc)", "Baso Ikan (1 pc)", "Cheese Dumpling (1 pc)", "Chicken Dumpling (1 pc)"];
const DAFTAR_TOPPING_PREM = ["Odeng Ori", "Odeng Spicy", "Telur"];

export function Step4Menu() {
  const { state, dispatch } = useBooking();
  const isReguler = state.packageId === "reguler";
  
  const pkgInfo = isReguler ? null : cateringPackages.find(p => p.id === state.packageId);
  const pkgName = pkgInfo?.name || "";
  const targetPorsi = pkgInfo?.portions || 0;

  // Helpers to add rows
  const addRow = (category: "mie" | "toppingReg" | "toppingPrem" | "odeng") => {
    const list = state[category];
    if (category === "mie" && list.length >= 3) return;
    if (category === "toppingReg" && list.length >= 3) return;
    
    dispatch({
      type: "SET_LINE_ITEM",
      payload: { category, items: [...list, { id: crypto.randomUUID(), name: "", qty: 0 }] }
    });
  };

  const removeRow = (category: "mie" | "toppingReg" | "toppingPrem" | "odeng", id: string) => {
    dispatch({
      type: "SET_LINE_ITEM",
      payload: { category, items: state[category].filter(i => i.id !== id) }
    });
  };

  const updateRow = (category: "mie" | "toppingReg" | "toppingPrem" | "odeng", id: string, field: "name" | "qty", val: string | number) => {
    dispatch({
      type: "SET_LINE_ITEM",
      payload: { category, items: state[category].map(i => i.id === id ? { ...i, [field]: val } : i) }
    });
  };

  // Visibility logic matching Vanilla JS updateVisibility()
  const showMie = isReguler || pkgName.toLowerCase().includes("mie") || pkgName.toLowerCase().includes("paket");
  const showTopReg = isReguler || pkgName.includes("Satu Topping") || pkgName.includes("Dua Topping") || pkgName.includes("Komplit") || pkgName.includes("Paket Odeng");
  const showPrem = isReguler || pkgName.includes("Premium");
  const showOdeng = pkgName.includes("Odeng") || pkgName.includes("Komplit");

  // On Package Change -> Reset & initialize required rows
  const handlePackageChange = (val: string) => {
    dispatch({ type: "SET_FIELD", payload: { field: "packageId", value: val } });
    
    // Reset all arrays
    dispatch({ type: "SET_LINE_ITEM", payload: { category: "mie", items: [{ id: crypto.randomUUID(), name: "", qty: 0 }] } });
    
    if (val === "reguler") {
      dispatch({ type: "SET_LINE_ITEM", payload: { category: "toppingReg", items: [] } });
      dispatch({ type: "SET_LINE_ITEM", payload: { category: "toppingPrem", items: [] } });
      dispatch({ type: "SET_LINE_ITEM", payload: { category: "odeng", items: [] } });
      return;
    }
    
    const pkg = cateringPackages.find(p => p.id === val);
    if (!pkg) return;
    const tn = pkg.name;

    // Init rows based on package requirements
    const tReg = [];
    if (tn.includes("Satu Topping")) tReg.push({ id: crypto.randomUUID(), name: "", qty: pkg.portions });
    if (tn.includes("Dua Topping") || tn.includes("Komplit") || tn.includes("Paket Odeng")) {
      tReg.push({ id: crypto.randomUUID(), name: "", qty: pkg.portions });
      tReg.push({ id: crypto.randomUUID(), name: "", qty: pkg.portions });
    }
    dispatch({ type: "SET_LINE_ITEM", payload: { category: "toppingReg", items: tReg } });

    const tPrem = [];
    if (tn.includes("Premium")) tPrem.push({ id: crypto.randomUUID(), name: "", qty: pkg.portions });
    dispatch({ type: "SET_LINE_ITEM", payload: { category: "toppingPrem", items: tPrem } });

    const tOdeng = [];
    if (tn.includes("Odeng") || tn.includes("Komplit")) {
      tOdeng.push({ id: crypto.randomUUID(), name: "", qty: pkg.portions });
      tOdeng.push({ id: crypto.randomUUID(), name: "", qty: 0 }); // Second odeng defaults to 0
    }
    dispatch({ type: "SET_LINE_ITEM", payload: { category: "odeng", items: tOdeng } });
  };

  // Auto Sync Logic (like syncToppingDenganMie) using Effect when state.mie changes
  useEffect(() => {
    if (!state.packageId || isReguler) return;
    
    const totalMie = state.mie.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    if (totalMie === 0) return;
    
    const porsiWajib = totalMie > targetPorsi ? totalMie : targetPorsi;

    // Sync Topping Reg
    if (showTopReg && state.toppingReg.length > 0) {
      let isChanged = false;
      const newReg = state.toppingReg.map(t => {
        if ((Number(t.qty) || 0) < porsiWajib) {
          isChanged = true;
          return { ...t, qty: porsiWajib };
        }
        return t;
      });
      if (isChanged) dispatch({ type: "SET_LINE_ITEM", payload: { category: "toppingReg", items: newReg } });
    }

    // Sync Topping Prem
    if (showPrem && state.toppingPrem.length > 0) {
      let isChanged = false;
      const newPrem = state.toppingPrem.map(t => {
        if ((Number(t.qty) || 0) < porsiWajib) {
          isChanged = true;
          return { ...t, qty: porsiWajib };
        }
        return t;
      });
      if (isChanged) dispatch({ type: "SET_LINE_ITEM", payload: { category: "toppingPrem", items: newPrem } });
    }

    // Sync Odeng
    if (showOdeng && state.odeng.length >= 2) {
      const o1 = Number(state.odeng[0].qty) || 0;
      const o2 = Number(state.odeng[1].qty) || 0;
      if (o1 + o2 < porsiWajib) {
        dispatch({
          type: "SET_LINE_ITEM",
          payload: { 
            category: "odeng", 
            items: [
              { ...state.odeng[0], qty: o1 + (porsiWajib - (o1 + o2)) },
              state.odeng[1]
            ]
          }
        });
      }
    }
  }, [state.mie, state.packageId, isReguler, targetPorsi, showTopReg, showPrem, showOdeng, dispatch]);


  const renderTable = (
    title: string, 
    desc: string, 
    key: "mie" | "toppingReg" | "toppingPrem" | "odeng", 
    options: string[], 
    limit: number, 
    icon: any
  ) => {
    const list = state[key];
    const Icon = icon;

    return (
      <div className="bg-muted p-4 sm:p-5 rounded-2xl border border-card-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm text-foreground">{title}</span>
          </div>
          {list.length < limit && (
            <button
              onClick={() => addRow(key)}
              className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
            >
              <CopyPlus className="w-3 h-3" /> Tambah Baris
            </button>
          )}
        </div>
        <p className="text-foreground/50 text-xs mb-4 max-w-sm">{desc}</p>
        
        <div className="space-y-3">
          {list.map((row) => (
            <div key={row.id} className="flex gap-2">
              <select
                value={row.name}
                onChange={(e) => updateRow(key, row.id, "name", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors appearance-none text-sm bg-card"
              >
                <option value="">-- Pilih Varian --</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              
              <div className="relative w-24 sm:w-32 shrink-0">
                <input
                  type="number"
                  min="0"
                  value={row.qty || ""}
                  onChange={(e) => updateRow(key, row.id, "qty", parseInt(e.target.value) || 0)}
                  placeholder="Porsi"
                  className="w-full px-3 py-2 text-center font-bold rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors text-sm bg-card pr-8 placeholder:font-normal"
                />
                <span className="absolute right-3 top-2.5 text-xs text-foreground/30 font-bold pointer-events-none">Px</span>
              </div>
              
              {list.length > 1 && (
                <button
                  onClick={() => removeRow(key, row.id)}
                  className="w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-1">Rakit Tagihanmu 🧾</h2>
        <p className="text-foreground/60 text-sm">Pilih porsinya sesuka hati. Gak ada *hidden fee*.</p>
      </div>

      <div className="space-y-6">
        
        {/* Package Dropdown */}
        <div>
           <label className="block text-sm font-semibold mb-2">Pilih Paket <span className="text-primary">*</span></label>
           <select
             value={state.packageId}
             onChange={(e) => handlePackageChange(e.target.value)}
             className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors appearance-none text-sm font-bold"
           >
             <option value="">-- Pilih Paket --</option>
             {cateringPackages.map(p => (
                <option key={p.id} value={p.id}>{p.name} — Rp {p.price.toLocaleString("id-ID")} | {p.portions} Porsi</option>
             ))}
           </select>
        </div>

        {!state.calculations.isValidReguler && state.packageId === "reguler" && (
          <div className="p-3 bg-primary/10 border-l-4 border-primary rounded text-sm text-primary font-bold">
            ⚠️ Minimum belanja untuk Paket Reguler adalah Rp 700.000 (tidak termasuk transport). Belanja Anda kurang Rp {(700000 - (state.calculations.basePrice + state.calculations.extraPrice + state.calculations.staffFee + state.calculations.extraFee)).toLocaleString("id-ID")}
          </div>
        )}

        {/* Dynamic Forms Render */}
        <div className="space-y-4">
          
          {/* MIE SECTION */}
          {showMie && state.packageId && renderTable(
            "Varian Mie", 
            isReguler ? "Ketikan jumlah porsi manual per baris." : "Jumlah varian mie harus disebar minimal sesuai porsi paket di atas.", 
            "mie", 
            DAFTAR_MIE, 
            3,
            UtensilsCrossed
          )}

          {/* TOPPING REG SECTION */}
          {showTopReg && state.packageId && renderTable(
            "Topping Reguler", 
            isReguler ? "Satu baris mewakili 1 porsi (Rp 3.500)." : "Akan tersinkronisasi otomatis dengan kuantitas mie paket.", 
            "toppingReg", 
            DAFTAR_TOPPING_REG, 
            3,
            Soup
          )}

          {/* TOPPING PREM SECTION */}
          {showPrem && state.packageId && renderTable(
            "Topping Premium", 
            "Pilih varian mewah dengan ekstra rasa.", 
            "toppingPrem", 
            DAFTAR_TOPPING_PREM, 
            isReguler ? 3 : 1,
            Gem
          )}

          {/* ODENG SECTION */}
          {showOdeng && state.packageId && (
             <div className="bg-muted p-4 sm:p-5 rounded-2xl border border-card-border">
                <div className="flex items-center gap-2 mb-2">
                  <FishSymbol className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm text-foreground">Varian Odeng Khusus</span>
                </div>
                <p className="text-foreground/50 text-xs mb-4 max-w-sm">Maksimal bisa 2 kuah original & spicy.</p>
                <div className="space-y-3">
                  {[0, 1].map((idx) => {
                    const row = state.odeng[idx];
                    if(!row) return null;
                    return (
                      <div key={row.id} className="flex gap-2">
                        <select
                          value={row.name}
                          onChange={(e) => updateRow("odeng", row.id, "name", e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-transparent focus:border-primary appearance-none text-sm bg-card focus:outline-none"
                        >
                          <option value="">-- Varian Odeng --</option>
                          <option value="Odeng Original">Odeng Original</option>
                          <option value="Odeng Spicy">Odeng Spicy</option>
                        </select>
                        <div className="relative w-24 sm:w-32 shrink-0">
                          <input
                            type="number"
                            min="0"
                            value={row.qty || ""}
                            onChange={(e) => updateRow("odeng", row.id, "qty", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-center font-bold rounded-lg border border-transparent focus:border-primary text-sm bg-card pr-8 focus:outline-none"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-foreground/30 font-bold pointer-events-none">Px</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
