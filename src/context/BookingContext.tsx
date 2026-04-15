"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { menuItems, cateringPackages } from "@/data/menu";

// --- Types ---
export type EventType = "Wedding" | "Gathering" | "Khitan" | "Pengajian" | "";
export type CityCode = "Jakarta" | "Bandung" | "Yogyakarta" | "";
export type StallType = "booth" | "gerobak" | "";
export type PaymentType = "full" | "dp" | "";

export interface LineItem {
  id: string; // To track input fields dynamically
  name: string;
  qty: number;
}

export interface BookingState {
  // Step 1: Profile
  name: string;
  whatsapp: string;
  eventType: EventType;
  
  // Step 2: Location
  city: CityCode;
  address: string;
  date: string;
  time: string;
  distanceKm: number;
  
  // Step 3: Stall & Equipment
  stallType: StallType;
  komporType: string;
  komporPrice: number;
  addTable: boolean;
  
  // Step 4: Menu
  packageId: string; // "reguler" or package ID
  mie: LineItem[];
  toppingReg: LineItem[];
  toppingPrem: LineItem[];
  odeng: LineItem[];
  
  // Step 5: Checkout
  paymentType: PaymentType;

  // Real-time Calculations
  calculations: {
    basePrice: number;
    extraPrice: number;
    totalPorsi: number;
    staffCount: number;
    staffFee: number;
    transportFee: number;
    extraFee: number;
    grandTotal: number;
    payNow: number;
    isValidReguler: boolean;
    isDpAllowed: boolean;
  };
}

export type BookingAction = 
  | { type: "SET_FIELD"; payload: { field: keyof BookingState; value: any } }
  | { type: "SET_LINE_ITEM"; payload: { category: "mie"|"toppingReg"|"toppingPrem"|"odeng"; items: LineItem[] } }
  | { type: "RESET_WIZARD" };

const initialState: BookingState = {
  name: "",
  whatsapp: "",
  eventType: "",
  city: "",
  address: "",
  date: "",
  time: "",
  distanceKm: 0,
  stallType: "",
  komporType: "",
  komporPrice: 0,
  addTable: false,
  packageId: "",
  mie: [],
  toppingReg: [],
  toppingPrem: [],
  odeng: [],
  paymentType: "full",
  calculations: {
    basePrice: 0,
    extraPrice: 0,
    totalPorsi: 0,
    staffCount: 0,
    staffFee: 0,
    transportFee: 0,
    extraFee: 0,
    grandTotal: 0,
    payNow: 0,
    isValidReguler: true,
    isDpAllowed: true,
  }
};

// --- Core Pricing Constants (from vanilla JS) ---
const HARGA_MIE = 8500; 
const HARGA_TOPPING = 3500;
const HARGA_TOPPING_PREM = 6500;
const T_BASE_FEE = 120000;
const STAFF_FEE_PER = 75000;

function calculateTotals(state: BookingState): BookingState["calculations"] {
  const isReguler = state.packageId === "reguler";
  const pkg = isReguler ? null : cateringPackages.find(p => p.id === state.packageId);
  const pkgName = pkg?.name || "";

  let basePrice = 0;
  let extraPrice = 0;
  let totalPorsi = 0;

  // 1. Calculate Porsi from User Input array
  const sumQty = (items: LineItem[]) => items.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  
  const totalMieInput = sumQty(state.mie);
  const totalTopRegInput = sumQty(state.toppingReg);
  const totalTopPremInput = sumQty(state.toppingPrem);
  const totalOdengInput = sumQty(state.odeng);

  if (isReguler) {
    totalPorsi = totalMieInput;
    basePrice = (totalMieInput * HARGA_MIE) + 
                (totalTopRegInput * HARGA_TOPPING) + 
                ((totalTopPremInput + totalOdengInput) * HARGA_TOPPING_PREM);
  } else if (pkg) {
    const basePorsi = pkg.portions;
    basePrice = pkg.price;
    
    // Auto sync requirements
    let reqTopReg = 0;
    if (pkgName.includes("Satu Topping")) reqTopReg = basePorsi;
    else if (pkgName.includes("Dua Topping") || pkgName.includes("Komplit") || pkgName.includes("Paket Odeng")) reqTopReg = basePorsi * 2;
    
    let reqTopPrem = pkgName.includes("Premium") ? basePorsi : 0;
    let reqOdeng = (pkgName.includes("Odeng") || pkgName.includes("Komplit")) ? basePorsi : 0;

    let extraMie = totalMieInput > basePorsi ? totalMieInput - basePorsi : 0;
    let extraTopReg = totalTopRegInput > reqTopReg ? totalTopRegInput - reqTopReg : 0;
    let extraTopPrem = totalTopPremInput > reqTopPrem ? totalTopPremInput - reqTopPrem : 0;
    let extraOdeng = totalOdengInput > reqOdeng ? totalOdengInput - reqOdeng : 0;

    extraPrice = (extraMie * HARGA_MIE) + 
                 (extraTopReg * HARGA_TOPPING) + 
                 ((extraTopPrem + extraOdeng) * HARGA_TOPPING_PREM);
                 
    totalPorsi = totalMieInput > basePorsi ? totalMieInput : basePorsi;
  }

  // 2. Staff Calculation
  let staffCount = 0;
  if (isReguler) {
    staffCount = 1;
  } else if (totalPorsi > 0) {
    staffCount = totalPorsi <= 200 ? 2 : 2 + Math.ceil((totalPorsi - 200) / 50);
  }
  
  let staffFee = staffCount * STAFF_FEE_PER;
  if (state.paymentType === "full" && !isReguler) {
    staffFee = 0; // Free for full payment (Package only)
  }

  // 3. Extra Fees
  let extraFee = state.komporPrice + (state.addTable ? 100000 : 0);
  if (isReguler && state.stallType === "gerobak") {
    extraFee += 250000;
  }

  // 4. Transport Fee
  let transportFee = 0;
  if (state.distanceKm > 0) {
    let perWay = T_BASE_FEE;
    if (state.distanceKm > 11) {
      const perKm = state.stallType === "booth" ? 6000 : 7000;
      perWay = T_BASE_FEE + Math.ceil(state.distanceKm - 11) * perKm;
    }
    transportFee = perWay * 2; // PP Trip
  }

  // 5. Final Totals
  const grandTotal = basePrice + extraPrice + staffFee + extraFee + transportFee;
  const payNow = state.paymentType === "dp" ? grandTotal * 0.5 : grandTotal;

  // validations
  const isValidReguler = isReguler ? (basePrice + extraPrice) >= 700000 : true;
  
  let isDpAllowed = true;
  if (state.date) {
    const eventDate = new Date(state.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) isDpAllowed = false;
  }

  return {
    basePrice,
    extraPrice,
    totalPorsi,
    staffCount,
    staffFee,
    transportFee,
    extraFee,
    grandTotal,
    payNow,
    isValidReguler,
    isDpAllowed
  };
}

function reducer(state: BookingState, action: BookingAction): BookingState {
  let newState = { ...state };

  switch (action.type) {
    case "SET_FIELD":
      newState = { ...state, [action.payload.field]: action.payload.value };
      break;
    case "SET_LINE_ITEM":
      newState = { ...state, [action.payload.category]: action.payload.items };
      break;
    case "RESET_WIZARD":
      return initialState;
    default:
      return state;
  }

  // Auto calculate on any change
  newState.calculations = calculateTotals(newState);
  
  // Re-adjust payment type if DP is no longer allowed
  if (newState.paymentType === "dp" && !newState.calculations.isDpAllowed) {
    newState.paymentType = "full";
    newState.calculations = calculateTotals(newState); // Recalculate with full payment rule
  }

  return newState;
}

const BookingContext = createContext<{
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
} | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <BookingContext.Provider value={{ state, dispatch }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
