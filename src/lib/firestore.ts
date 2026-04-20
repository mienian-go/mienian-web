import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// MENU ITEMS
export const getMenuItems = async (onlyActive = false) => {
  const q = onlyActive
    ? query(collection(db, "menu_items"), where("isActive", "==", true), orderBy("sortOrder", "asc"))
    : query(collection(db, "menu_items"), orderBy("sortOrder", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// CATERING PACKAGES
export const getCateringPackages = async (onlyActive = false) => {
  const q = onlyActive
    ? query(collection(db, "catering_packages"), where("isActive", "==", true), orderBy("sortOrder", "asc"))
    : query(collection(db, "catering_packages"), orderBy("sortOrder", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ORDERS
export interface Order {
  id: string;
  orderId?: string;
  status: string;
  totalPrice: number;
  event?: {
    picName?: string;
    date?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const createOrder = async (orderData: any) => {
  // Promise race to prevent infinite hanging
  const timeoutStr = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Firebase Database tidak merespon (Timeout 10 detik). URL salah atau Database Firestore belum ada di Konsol.")), 10000)
  );
  
  try {
    const docRef: any = await Promise.race([
      addDoc(collection(db, "orders"), {
        ...orderData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }),
      timeoutStr
    ]);
    return docRef.id;
  } catch (error) {
    console.error("Firebase Database Error:", error);
    throw error;
  }
};

export const getOrders = async (): Promise<Order[]> => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status,
    updatedAt: Timestamp.now(),
  });
};

// SETTINGS
export const getSettings = async () => {
  const docRef = doc(db, "settings", "global");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  // Default fallback if not found
  return {
    bankName: "BCA",
    bankAccount: "1234567890",
    bankHolder: "PT Mie Kekinian Sukses",
    whatsappNumber: "6285216706922",
  };
};

export const updateSettings = async (data: any) => {
  const docRef = doc(db, "settings", "global");
  await setDoc(docRef, { ...data, updatedAt: Timestamp.now() }, { merge: true });
};
