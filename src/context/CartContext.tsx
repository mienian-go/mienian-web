"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  portions: number;
  quantity: number;
  category: "wedding" | "corporate" | "reguler";
}

export interface EventDetails {
  picName: string;
  whatsapp: string;
  date: string;
  time: string;
  venue: string;
  notes: string;
}

export interface PaymentConfirmation {
  bankOrWallet: string;
  senderName: string;
  receiptFile: File | null;
}

interface CartState {
  items: CartItem[];
  eventDetails: EventDetails | null;
  paymentConfirmation: PaymentConfirmation | null;
  orderId: string | null;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "SET_EVENT_DETAILS"; payload: EventDetails }
  | { type: "SET_PAYMENT_CONFIRMATION"; payload: PaymentConfirmation }
  | { type: "GENERATE_ORDER_ID" }
  | { type: "SET_ORDER_ID"; payload: string }
  | { type: "CLEAR_CART" };

function generateOrderId(): string {
  const num = Math.floor(Math.random() * 999) + 1;
  return `#MIENIAN-EVNT${String(num).padStart(3, "0")}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
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
    case "SET_EVENT_DETAILS":
      return { ...state, eventDetails: action.payload };
    case "SET_PAYMENT_CONFIRMATION":
      return { ...state, paymentConfirmation: action.payload };
    case "GENERATE_ORDER_ID":
      return { ...state, orderId: generateOrderId() };
    case "SET_ORDER_ID":
      return { ...state, orderId: action.payload };
    case "CLEAR_CART":
      return { items: [], eventDetails: null, paymentConfirmation: null, orderId: null };
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalPrice: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    eventDetails: null,
    paymentConfirmation: null,
    orderId: null,
  });

  const totalPrice = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ state, dispatch, totalPrice, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
