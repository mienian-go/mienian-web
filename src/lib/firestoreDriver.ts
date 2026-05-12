import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// KANGDOMIE DRIVERS
// Collection: kangdomie_drivers
// ============================================

export interface KangDoMieDriver {
  uid: string;
  name: string;
  phone: string;
  gerobakId: string;
  isOnline: boolean;
  isApproved: boolean;
  createdAt: any;
  updatedAt: any;
}

export async function getDriver(uid: string): Promise<KangDoMieDriver | null> {
  const snap = await getDoc(doc(db, "kangdomie_drivers", uid));
  if (snap.exists()) return { uid, ...snap.data() } as KangDoMieDriver;
  return null;
}

export async function registerDriver(uid: string, data: { name: string; phone: string; gerobakId: string }): Promise<void> {
  await setDoc(doc(db, "kangdomie_drivers", uid), {
    ...data,
    uid,
    isOnline: false,
    isApproved: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function setDriverOnline(uid: string, isOnline: boolean): Promise<void> {
  await updateDoc(doc(db, "kangdomie_drivers", uid), {
    isOnline,
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// KANGDOMIE ORDERS (filtered from orders collection)
// ============================================

export interface KangDoMieOrder {
  id: string;
  orderId: string;
  customerName: string;
  whatsapp: string;
  address: string;
  items: any[];
  costs: any;
  status: string;
  orderMode: string;
  assignedDriver?: string;
  createdAt: any;
  [key: string]: any;
}

export function subscribeToDriverOrders(driverUid: string, callback: (orders: KangDoMieOrder[]) => void) {
  const q = query(
    collection(db, "orders"),
    where("assignedDriver", "==", driverUid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as KangDoMieOrder)));
  });
}

export function subscribeToUnassignedOrders(city: string, callback: (orders: KangDoMieOrder[]) => void) {
  // Get paid delivery orders without assigned driver
  const q = query(
    collection(db, "orders"),
    where("status", "==", "paid"),
    where("orderType", "==", "delivery"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const orders = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as KangDoMieOrder))
      .filter((o) => !o.assignedDriver);
    callback(orders);
  });
}

export async function acceptOrder(orderId: string, driverUid: string): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), {
    assignedDriver: driverUid,
    status: "preparing",
    updatedAt: Timestamp.now(),
  });
}

export async function updateOrderStatusDriver(orderId: string, status: string): Promise<void> {
  const updates: any = { status, updatedAt: Timestamp.now() };
  if (status === "delivered") {
    updates.deliveredAt = Timestamp.now();
  }
  await updateDoc(doc(db, "orders", orderId), updates);
}
