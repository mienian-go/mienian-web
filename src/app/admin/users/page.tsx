"use client";

import { useState, useEffect } from "react";
import { Loader2, User as UserIcon, Mail, Phone, Calendar, Search, ShieldCheck, ShieldAlert, Star } from "lucide-react";
import { collection, query, orderBy, onSnapshot, getDocs, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    if (!currentUser) return;

    // Fetch real 'users' collection with fallback 'orders'
    const unsubscribeUsers = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), (userSnap) => {
      const usersData = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), source: "users" } as any));
      
      // Fetch unique customers from orders as a fallback
      getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))).then((orderSnap) => {
        const uniqueCustomers: any[] = [];
        const seenEmails = new Set(usersData.map(u => u.email?.toLowerCase()));
        
        orderSnap.docs.forEach(doc => {
          const data = doc.data();
          const email = data.email || data.event?.email; 
          if (email && !seenEmails.has(email.toLowerCase())) {
            uniqueCustomers.push({
              id: "legacy-" + doc.id,
              email: email,
              name: data.customerName || data.event?.picName || "Legacy Customer",
              whatsapp: data.whatsapp || data.event?.whatsapp || "-",
              createdAt: data.createdAt,
              source: "orders",
              roleLabel: "Customer (Old)",
              role: "customer"
            });
            seenEmails.add(email.toLowerCase());
          }
        });
        
        setUsers([...usersData, ...uniqueCustomers]);
        setLoading(false);
      });
    });

    return () => unsubscribeUsers();
  }, [currentUser]);


  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.whatsapp?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">User Management</h1>
          <p className="text-foreground/50 mt-1">
            Daftar pelanggan yang terdaftar di sistem.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card border border-white/5 rounded-2xl px-4 py-2 w-full max-w-md shadow-xl">
        <Search className="w-4 h-4 text-foreground/40" />
        <input 
          type="text" 
          placeholder="Cari email, nama, atau WhatsApp..."
          className="bg-transparent border-none focus:outline-none text-sm w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden shadow-2xl border-white/5">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/50 uppercase bg-muted/50 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Joined Date</th>
                <th className="px-6 py-4 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-foreground/50">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={user.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary relative">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold">{user.name || "No Name"}</div>
                          <div className="text-[10px] text-foreground/40 font-mono">{user.id.slice(0, 12)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Mail className="w-3 h-3 text-primary" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="w-3 h-3 text-green-500" />
                        <span>{user.whatsapp || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-foreground/70">
                        <Calendar className="w-3 h-3" />
                        {user.createdAt ? new Date(user.createdAt.seconds ? user.createdAt.seconds * 1000 : user.createdAt).toLocaleDateString("id-ID") : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit bg-blue-500/20 text-blue-500 border border-blue-500/20">
                          Customer
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
