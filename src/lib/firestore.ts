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
export const createOrder = async (orderData: any) => {
  const docRef = await addDoc(collection(db, "orders"), {
    ...orderData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getOrders = async () => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
