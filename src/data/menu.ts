export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: "mie" | "topping-reguler" | "topping-premium" | "topping-super";
  description?: string;
}


export const menuItems: MenuItem[] = [
  // Pilihan Mie - Rp 8.500
  { id: "mie-goreng-original", name: "Indomie Goreng Original", price: 8500, category: "mie" },
  { id: "mie-goreng-rendang", name: "Indomie Goreng Rendang", price: 8500, category: "mie" },
  { id: "mie-goreng-geprek", name: "Indomie Goreng Ayam Geprek", price: 8500, category: "mie" },
  { id: "mie-goreng-aceh", name: "Indomie Goreng Aceh", price: 8500, category: "mie" },
  { id: "mie-kari-ayam", name: "Indomie Kari Ayam", price: 8500, category: "mie" },
  { id: "mie-soto", name: "Indomie Soto", price: 8500, category: "mie" },
  { id: "mie-ayam-spesial", name: "Indomie Ayam Spesial", price: 8500, category: "mie" },
  { id: "mie-ayam-bawang", name: "Indomie Ayam Bawang", price: 8500, category: "mie" },
  { id: "mie-seblak", name: "Indomie Seblak", price: 8500, category: "mie" },
  { id: "mie-bangladese", name: "Indomie Banglades'e", price: 8500, category: "mie" },

  // Topping Reguler - Rp 3.500
  { id: "top-baso-sapi", name: "Baso Sapi", price: 3500, category: "topping-reguler" },
  { id: "top-baso-salmon", name: "Baso Salmon", price: 3500, category: "topping-reguler" },
  { id: "top-cheese-dumpling", name: "Cheese Dumpling", price: 3500, category: "topping-reguler" },

  // Topping Premium - Rp 6.500
  { id: "top-odeng-original", name: "Odeng Original", price: 6500, category: "topping-premium" },
  { id: "top-odeng-spicy", name: "Odeng Spicy", price: 6500, category: "topping-premium" },
  { id: "top-telor-ceplok", name: "Telor Ceplok", price: 6500, category: "topping-premium" },

  // Topping Super - Rp 11.000
  { id: "top-chicken-katsu", name: "Chicken Katsu", price: 11000, category: "topping-super" },
  { id: "top-grill-chicken", name: "Grill Chicken", price: 11000, category: "topping-super" },
  { id: "top-beef-enoki", name: "Beef Enoki", price: 11000, category: "topping-super" },
];


export const categoryLabels: Record<MenuItem["category"], string> = {
  mie: "Pilihan Mie",
  "topping-reguler": "Topping Reguler",
  "topping-premium": "Topping Premium",
  "topping-super": "Topping Super",
};

export const categoryPrices: Record<MenuItem["category"], number> = {
  mie: 8500,
  "topping-reguler": 3500,
  "topping-premium": 6500,
  "topping-super": 11000,
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
