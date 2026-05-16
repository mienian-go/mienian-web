import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// SALES
// ============================================

export interface SaleItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface KangDoMieSale {
  id?: string;
  driverId: string;
  driverName: string;
  orderId?: string;
  items: SaleItem[];
  totalAmount: number;
  commission: number;
  saleType: "online" | "pos";
  createdAt: any;
}

/** Calculate commission: Rp 1.000 per Rp 10.000 total */
export function calculateCommission(totalAmount: number): number {
  return Math.floor(totalAmount / 10000) * 1000;
}

/** Record a sale and update driver stats */
export async function recordSale(sale: Omit<KangDoMieSale, "id" | "commission" | "createdAt">): Promise<string> {
  const commission = calculateCommission(sale.totalAmount);

  const docRef = await addDoc(collection(db, "kangdomie_sales"), {
    ...sale,
    commission,
    createdAt: Timestamp.now(),
  });

  // Update driver running totals
  await updateDoc(doc(db, "kangdomie_drivers", sale.driverId), {
    totalSales: increment(sale.totalAmount),
    totalCommission: increment(commission),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

/** Get sales for a driver in a date range */
export async function getSalesByDriver(
  driverId: string,
  startDate: Date,
  endDate: Date
): Promise<KangDoMieSale[]> {
  // Query without orderBy to avoid composite index requirement
  const q = query(
    collection(db, "kangdomie_sales"),
    where("driverId", "==", driverId),
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<=", Timestamp.fromDate(endDate))
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as KangDoMieSale))
    .sort((a, b) => {
      const aMs = a.createdAt?.toMillis?.() || 0;
      const bMs = b.createdAt?.toMillis?.() || 0;
      return bMs - aMs;
    });
}

/** Get commission totals for a driver in a period */
export async function getDriverCommissionForPeriod(
  driverId: string,
  startDate: Date,
  endDate: Date
): Promise<{ totalSales: number; totalCommission: number; count: number }> {
  const sales = await getSalesByDriver(driverId, startDate, endDate);
  return {
    totalSales: sales.reduce((sum, s) => sum + s.totalAmount, 0),
    totalCommission: sales.reduce((sum, s) => sum + s.commission, 0),
    count: sales.length,
  };
}

/** Get leaderboard — top N drivers by totalSales */
export async function getLeaderboard(topN: number = 10): Promise<any[]> {
  const q = query(
    collection(db, "kangdomie_drivers"),
    where("isApproved", "==", true),
    orderBy("totalSales", "desc"),
    limit(topN)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ rank: i + 1, uid: d.id, ...d.data() }));
}

/** Subscribe to leaderboard (real-time) */
export function subscribeToLeaderboard(topN: number, callback: (drivers: any[]) => void) {
  const q = query(
    collection(db, "kangdomie_drivers"),
    where("isApproved", "==", true),
    orderBy("totalSales", "desc"),
    limit(topN)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d, i) => ({ rank: i + 1, uid: d.id, ...d.data() })));
  });
}

// ============================================
// ATTENDANCE
// ============================================

export interface Attendance {
  id?: string;
  driverId: string;
  date: string; // "2026-05-13"
  checkInTime: any;
  checkOutTime: any;
  checkInBarcode: string;
  status: "checked_in" | "checked_out";
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Check in driver */
export async function checkIn(driverId: string, barcode: string): Promise<{ success: boolean; message: string }> {
  const today = todayString();
  const docId = `${driverId}_${today}`;
  const docRef = doc(db, "kangdomie_attendance", docId);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    const data = existing.data();
    if (data.status === "checked_in") {
      return { success: false, message: "Kamu sudah check-in hari ini." };
    }
    if (data.status === "checked_out") {
      return { success: false, message: "Kamu sudah check-in dan check-out hari ini." };
    }
  }

  await setDoc(docRef, {
    driverId,
    date: today,
    checkInTime: Timestamp.now(),
    checkOutTime: null,
    checkInBarcode: barcode,
    status: "checked_in",
  });

  // Increment work days
  await updateDoc(doc(db, "kangdomie_drivers", driverId), {
    workDays: increment(1),
    updatedAt: Timestamp.now(),
  });

  return { success: true, message: "Check-in berhasil! Semangat jualan hari ini 🔥" };
}

/** Check out driver */
export async function checkOut(driverId: string): Promise<{ success: boolean; message: string }> {
  const today = todayString();
  const docId = `${driverId}_${today}`;
  const docRef = doc(db, "kangdomie_attendance", docId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    return { success: false, message: "Kamu belum check-in hari ini." };
  }
  const data = existing.data();
  if (data.status === "checked_out") {
    return { success: false, message: "Kamu sudah check-out hari ini." };
  }

  await updateDoc(docRef, {
    checkOutTime: Timestamp.now(),
    status: "checked_out",
  });

  return { success: true, message: "Check-out berhasil! Istirahat yang cukup ya 💤" };
}

/** Get today's attendance */
export async function getTodayAttendance(driverId: string): Promise<Attendance | null> {
  const today = todayString();
  const docId = `${driverId}_${today}`;
  const snap = await getDoc(doc(db, "kangdomie_attendance", docId));
  if (snap.exists()) return { id: snap.id, ...snap.data() } as Attendance;
  return null;
}

/** Get attendance for a month */
export async function getMonthlyAttendance(driverId: string, year: number, month: number): Promise<Attendance[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const q = query(
    collection(db, "kangdomie_attendance"),
    where("driverId", "==", driverId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attendance));
}

// ============================================
// PER-DRIVER INVENTORY
// ============================================

/** Default stock per category (used for daily reset) */
export const DEFAULT_STOCK: Record<string, number> = {
  "mie": 15,
  "topping-reguler": 10,
  "topping-premium": 5,
  "topping-super": 5,
};

/** Get driver's inventory (map of itemId -> stock) */
export async function getDriverInventory(driverId: string): Promise<Record<string, number>> {
  const snap = await getDoc(doc(db, "kangdomie_drivers", driverId));
  if (snap.exists()) {
    return snap.data().inventory || {};
  }
  return {};
}

/** Update a single item's stock for a driver */
export async function updateDriverItemStock(driverId: string, itemId: string, stock: number): Promise<void> {
  await updateDoc(doc(db, "kangdomie_drivers", driverId), {
    [`inventory.${itemId}`]: stock,
    updatedAt: Timestamp.now(),
  });
}

/** Decrement driver's item stock after sale */
export async function decrementDriverStock(driverId: string, itemId: string, qty: number): Promise<void> {
  await updateDoc(doc(db, "kangdomie_drivers", driverId), {
    [`inventory.${itemId}`]: increment(-qty),
    updatedAt: Timestamp.now(),
  });
}

/** Refill a single driver's inventory to defaults based on menu categories */
export async function refillDriverInventory(driverId: string, menuItems: { id: string; category: string }[]): Promise<void> {
  const inventory: Record<string, number> = {};
  for (const item of menuItems) {
    inventory[item.id] = DEFAULT_STOCK[item.category] ?? 10;
  }
  await updateDoc(doc(db, "kangdomie_drivers", driverId), {
    inventory,
    lastInventoryReset: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/** Refill ALL approved drivers' inventory */
export async function refillAllDriversInventory(menuItems: { id: string; category: string }[]): Promise<number> {
  const q = query(collection(db, "kangdomie_drivers"), where("isApproved", "==", true));
  const snap = await getDocs(q);
  let count = 0;
  for (const d of snap.docs) {
    await refillDriverInventory(d.id, menuItems);
    count++;
  }
  return count;
}

// ============================================
// DATE HELPERS
// ============================================

export function getDateRange(period: "daily" | "weekly" | "monthly"): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (period === "daily") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    return { start, end };
  }
  if (period === "weekly") {
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  // monthly
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  return { start, end };
}
