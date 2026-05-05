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
  const q = query(collection(db, "menu_items"), orderBy("sortOrder", "asc"));
  const snapshot = await getDocs(q);
  let items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
  if (onlyActive) {
    items = items.filter((item: any) => item.isActive === true);
  }
  return items;
};

// CATERING PACKAGES
export const getCateringPackages = async (onlyActive = false) => {
  const q = query(collection(db, "catering_packages"), orderBy("sortOrder", "asc"));
  const snapshot = await getDocs(q);
  let packages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
  if (onlyActive) {
    packages = packages.filter((pkg: any) => pkg.isActive === true);
  }
  return packages;
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

// AFFILIATES
export const registerAffiliate = async (data: any) => {
  const docRef = await addDoc(collection(db, "affiliates"), {
    ...data,
    status: "pending",
    approvedCode: "",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getAffiliates = async (): Promise<any[]> => {
  const q = query(collection(db, "affiliates"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateAffiliateStatus = async (id: string, status: string, approvedCode?: string) => {
  const ref = doc(db, "affiliates", id);
  const payload: any = { status, updatedAt: Timestamp.now() };
  if (approvedCode !== undefined) payload.approvedCode = approvedCode;
  await updateDoc(ref, payload);
};

export const deleteAffiliate = async (id: string) => {
  await deleteDoc(doc(db, "affiliates", id));
};

export const getAffiliateByEmail = async (email: string) => {
  const q = query(collection(db, "affiliates"), where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() };
};

export const getOrdersByAffiliateCode = async (code: string): Promise<Order[]> => {
  const q = query(collection(db, "orders"), where("affiliateCode", "==", code));
  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  // Sort in memory to avoid needing a composite index
  return orders.sort((a, b) => {
    const dateA = a.createdAt?.seconds || 0;
    const dateB = b.createdAt?.seconds || 0;
    return dateB - dateA;
  });
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const q = query(collection(db, "orders"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  return orders.sort((a, b) => {
    const dateA = a.createdAt?.seconds || 0;
    const dateB = b.createdAt?.seconds || 0;
    return dateB - dateA;
  });
};

// USERS / CUSTOMERS
export const getUsers = async (): Promise<any[]> => {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateUserProfile = async (uid: string, data: any) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    ...data,
    updatedAt: Timestamp.now(),
    createdAt: data.createdAt || Timestamp.now(),
  }, { merge: true });
};

// ADMIN & ROLES
export type AdminRole = "superadmin" | "staff" | "content_writer";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  name: string;
  createdAt?: any;
  updatedAt?: any;
}

export const getAdmins = async (): Promise<AdminUser[]> => {
  const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AdminUser));
};

export const getAdminRole = async (uid: string): Promise<AdminRole | null> => {
  const ref = doc(db, "admins", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().role as AdminRole;
  }
  return null;
};

export const updateAdminRole = async (uid: string, role: AdminRole) => {
  const ref = doc(db, "admins", uid);
  await updateDoc(ref, { role, updatedAt: Timestamp.now() });
};

export const deleteAdmin = async (uid: string) => {
  await deleteDoc(doc(db, "admins", uid));
};

// BLOG POSTS
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  status: "draft" | "review" | "published";
  publishedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export const createBlogPost = async (data: Omit<BlogPost, "id">) => {
  const docRef = await addDoc(collection(db, "blog_posts"), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    publishedAt: data.status === "published" ? Timestamp.now() : null,
  });
  return docRef.id;
};

export const updateBlogPost = async (id: string, data: Partial<BlogPost>) => {
  const ref = doc(db, "blog_posts", id);
  const payload: any = { ...data, updatedAt: Timestamp.now() };
  if (data.status === "published" && !data.publishedAt) {
    payload.publishedAt = Timestamp.now();
  }
  await updateDoc(ref, payload);
};

export const deleteBlogPost = async (id: string) => {
  await deleteDoc(doc(db, "blog_posts", id));
};

export const getBlogPosts = async (onlyPublished = false): Promise<BlogPost[]> => {
  let q;
  if (onlyPublished) {
    q = query(collection(db, "blog_posts"), where("status", "==", "published"));
  } else {
    q = query(collection(db, "blog_posts"), orderBy("createdAt", "desc"));
  }
  const snapshot = await getDocs(q);
  let posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
  if (onlyPublished) {
    posts = posts.sort((a, b) => {
      const dateA = a.publishedAt?.seconds || 0;
      const dateB = b.publishedAt?.seconds || 0;
      return dateB - dateA;
    });
  }
  return posts;
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  const q = query(collection(db, "blog_posts"), where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as BlogPost;
};
