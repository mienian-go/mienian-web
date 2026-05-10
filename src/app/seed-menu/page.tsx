"use client";

import { useState } from "react";
import { collection, addDoc, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

const menuItems = [
  // === MIE ===
  { name: "Indomie Goreng Original", price: 8500, category: "mie", sortOrder: 10, isActive: true },
  { name: "Indomie Kuah Soto", price: 8500, category: "mie", sortOrder: 20, isActive: true },
  { name: "Indomie Goreng Rendang", price: 8500, category: "mie", sortOrder: 30, isActive: true },
  { name: "Indomie Kuah Kari Ayam", price: 8500, category: "mie", sortOrder: 40, isActive: true },
  { name: "Indomie Goreng Pedas", price: 8500, category: "mie", sortOrder: 50, isActive: true },
  { name: "Indomie Kuah Ayam Bawang", price: 8500, category: "mie", sortOrder: 60, isActive: true },

  // === TOPPING REGULER ===
  { name: "Telur Ceplok", price: 3500, category: "topping-reguler", sortOrder: 100, isActive: true },
  { name: "Telur Dadar", price: 3500, category: "topping-reguler", sortOrder: 110, isActive: true },
  { name: "Kornet", price: 3500, category: "topping-reguler", sortOrder: 120, isActive: true },
  { name: "Sosis", price: 3500, category: "topping-reguler", sortOrder: 130, isActive: true },
  { name: "Nugget", price: 3500, category: "topping-reguler", sortOrder: 140, isActive: true },

  // === TOPPING PREMIUM ===
  { name: "Daging Sapi Slice", price: 8000, category: "topping-premium", sortOrder: 200, isActive: true },
  { name: "Ayam Katsu", price: 8000, category: "topping-premium", sortOrder: 210, isActive: true },
  { name: "Udang Tempura", price: 8000, category: "topping-premium", sortOrder: 220, isActive: true },
  { name: "Crab Stick", price: 8000, category: "topping-premium", sortOrder: 230, isActive: true },
];

export default function SeedMenuPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    setStatus("Checking existing data...");
    
    try {
      // Check if menu items already exist
      const existing = await getDocs(query(collection(db, "menu_items")));
      if (existing.docs.length > 0) {
        setStatus(`⚠️ Sudah ada ${existing.docs.length} menu items di Firestore. Seed dibatalkan.`);
        setLoading(false);
        return;
      }

      setStatus("Seeding menu items...");
      
      for (const item of menuItems) {
        await addDoc(collection(db, "menu_items"), {
          ...item,
          createdAt: new Date(),
        });
      }

      setStatus(`✅ Berhasil seed ${menuItems.length} menu items ke Firestore!`);
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="card p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">🌱 Seed Menu Items</h1>
        <p className="text-foreground/60 text-sm mb-6">
          Klik tombol di bawah untuk mengisi data menu contoh (Mie, Topping Reguler, Topping Premium) ke Firestore.
        </p>
        <button 
          onClick={handleSeed}
          disabled={loading}
          className="btn btn-primary w-full py-3 mb-4"
        >
          {loading ? "Seeding..." : "Seed Menu Data"}
        </button>
        {status && (
          <p className="text-sm font-bold mt-4 p-3 bg-muted rounded-xl">{status}</p>
        )}
      </div>
    </div>
  );
}
