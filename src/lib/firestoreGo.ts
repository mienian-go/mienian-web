import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  Timestamp,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// USER POINTS (Mienian Power)
// Collection: user_points
// ============================================

export interface UserPoints {
  userId: string;
  displayName: string;
  points: number;
  totalSpent: number;
  totalOrders: number;
  level: number;
  createdAt: any;
  updatedAt: any;
}

const LEVEL_THRESHOLDS = [0, 500, 2000, 5000, 10000, 25000];
const POINTS_PER_1000 = 100; // 100 poin per Rp 1.000

export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

export async function getUserPoints(userId: string): Promise<UserPoints | null> {
  const docRef = doc(db, "user_points", userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { userId, ...snap.data() } as UserPoints;
  }
  return null;
}

export async function initUserPoints(userId: string, displayName: string): Promise<UserPoints> {
  const docRef = doc(db, "user_points", userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { userId, ...snap.data() } as UserPoints;
  }
  const data: UserPoints = {
    userId,
    displayName,
    points: 0,
    totalSpent: 0,
    totalOrders: 0,
    level: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(docRef, data);
  return data;
}

export async function earnPoints(userId: string, amountSpent: number, displayName?: string): Promise<number> {
  const pointsEarned = Math.floor(amountSpent / 1000) * POINTS_PER_1000;
  if (pointsEarned <= 0) return 0;

  const docRef = doc(db, "user_points", userId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const currentData = snap.data();
    const newPoints = (currentData.points || 0) + pointsEarned;
    const newLevel = calculateLevel(newPoints);
    await updateDoc(docRef, {
      points: increment(pointsEarned),
      totalSpent: increment(amountSpent),
      totalOrders: increment(1),
      level: newLevel,
      updatedAt: Timestamp.now(),
    });
  } else {
    const newLevel = calculateLevel(pointsEarned);
    await setDoc(docRef, {
      userId,
      displayName: displayName || "User",
      points: pointsEarned,
      totalSpent: amountSpent,
      totalOrders: 1,
      level: newLevel,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  return pointsEarned;
}

export async function redeemPoints(userId: string, pointsToRedeem: number): Promise<boolean> {
  const docRef = doc(db, "user_points", userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return false;

  const currentPoints = snap.data().points || 0;
  if (currentPoints < pointsToRedeem) return false;

  const newPoints = currentPoints - pointsToRedeem;
  await updateDoc(docRef, {
    points: newPoints,
    level: calculateLevel(newPoints),
    updatedAt: Timestamp.now(),
  });
  return true;
}

export function subscribeToUserPoints(userId: string, callback: (data: UserPoints | null) => void) {
  const docRef = doc(db, "user_points", userId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ userId, ...snap.data() } as UserPoints);
    } else {
      callback(null);
    }
  });
}

// ============================================
// DAILY QUESTS
// Collection: daily_quests
// ============================================

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  reward: string;
  emoji: string;
  isActive: boolean;
  expiresAt: any;
  createdAt: any;
}

export async function getActiveDailyQuests(): Promise<DailyQuest[]> {
  const q = query(
    collection(db, "daily_quests"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DailyQuest));
}

export async function createDailyQuest(data: Omit<DailyQuest, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "daily_quests"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateDailyQuest(id: string, data: Partial<DailyQuest>): Promise<void> {
  await updateDoc(doc(db, "daily_quests", id), data);
}

export async function deleteDailyQuest(id: string): Promise<void> {
  await deleteDoc(doc(db, "daily_quests", id));
}

// ============================================
// KANGDOMIE LOCATIONS
// Collection: kangdomie_locations
// ============================================

export interface KangDoMieLocation {
  id: string;
  name: string;
  driverName: string;
  lat: number;
  lng: number;
  status: "available" | "busy" | "offline";
  eta?: string;
  lastUpdated: any;
}

export async function getKangDoMieLocations(): Promise<KangDoMieLocation[]> {
  const q = query(
    collection(db, "kangdomie_locations"),
    where("status", "in", ["available", "busy"])
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as KangDoMieLocation));
}

export function subscribeToKangDoMieLocations(callback: (locations: KangDoMieLocation[]) => void) {
  const q = query(
    collection(db, "kangdomie_locations"),
    where("status", "in", ["available", "busy"])
  );
  return onSnapshot(q, (snap) => {
    const locations = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as KangDoMieLocation));
    callback(locations);
  });
}

export async function upsertKangDoMieLocation(id: string, data: Omit<KangDoMieLocation, "id">): Promise<void> {
  await setDoc(doc(db, "kangdomie_locations", id), {
    ...data,
    lastUpdated: Timestamp.now(),
  }, { merge: true });
}

export async function deleteKangDoMieLocation(id: string): Promise<void> {
  await deleteDoc(doc(db, "kangdomie_locations", id));
}

// ============================================
// IN-APP CHAT
// Subcollection: orders/{orderId}/chats
// ============================================

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "customer" | "driver";
  message: string;
  createdAt: any;
}

export async function sendChatMessage(
  orderId: string,
  data: Omit<ChatMessage, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, "orders", orderId, "chats"), {
    ...data,
    createdAt: Timestamp.now(),
  });
}

export function subscribeToChatMessages(
  orderId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, "orders", orderId, "chats"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
  });
}

