"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";

export interface GoCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  notes?: string;
}

export interface GoCartState {
  items: GoCartItem[];
  customerName: string;
  whatsapp: string;
  address: string;
  distanceKm: number;
  lat: number | null;
  lng: number | null;
  orderMode: "delivery" | "pickup";
  driverId?: string;
  driverName?: string;
}

type GoCartAction =
  | { type: "ADD_ITEM"; payload: GoCartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "SET_NOTES"; payload: { id: string; notes: string } }
  | { type: "SET_DELIVERY_DETAILS"; payload: Partial<GoCartState> }
  | { type: "CLEAR_CART" };

const initialState: GoCartState = {
  items: [],
  customerName: "",
  whatsapp: "",
  address: "",
  distanceKm: 0,
  lat: null,
  lng: null,
  orderMode: "delivery",
  driverId: undefined,
  driverName: undefined,
};

function goCartReducer(state: GoCartState, action: GoCartAction): GoCartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find((i) => i.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.payload.id ? { ...i, quantity: i.quantity + action.payload.quantity } : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) };
    case "UPDATE_QUANTITY":
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i
        ),
      };
    case "SET_NOTES":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, notes: action.payload.notes } : i
        ),
      };
    case "SET_DELIVERY_DETAILS":
      return { ...state, ...action.payload };
    case "CLEAR_CART":
      return { ...initialState };
    default:
      return state;
  }
}

interface GoCartContextType {
  state: GoCartState;
  dispatch: React.Dispatch<GoCartAction>;
  totalPrice: number;
  totalItems: number;
}

const GoCartContext = createContext<GoCartContextType | undefined>(undefined);

const STORAGE_KEY = "mienian_gocart_state";

export function GoCartProvider({ children }: { children: ReactNode }) {
  // Load initial state from localStorage if available
  const [state, dispatch] = useReducer(goCartReducer, initialState, (initial) => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse cart from localStorage", e);
        }
      }
    }
    return initial;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <GoCartContext.Provider value={{ state, dispatch, totalPrice, totalItems }}>
      {children}
    </GoCartContext.Provider>
  );
}

export function useGoCart() {
  const context = useContext(GoCartContext);
  if (!context) {
    throw new Error("useGoCart must be used within a GoCartProvider");
  }
  return context;
}
