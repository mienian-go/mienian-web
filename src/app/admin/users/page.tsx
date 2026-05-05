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
  const [currentUserRole, setCurrentUserRole] = useState<string>("customer");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Check current user's role and handle Master Admin auto-promotion
    const checkRole = async () => {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      let role = "customer";
      if (userSnap.exists()) {
        role = userSnap.data().role || (userSnap.data().isAdmin ? "admin" : "customer");
      }

      // Auto-promote master admin email
      if (currentUser.email === "mienianid@gmail.com" && role !== "master_admin") {
        await setDoc(userRef, { 
          role: "master_admin", 
          isAdmin: true,
          email: currentUser.email,
          name: currentUser.displayName || "Master Admin" 
        }, { merge: true });
        role = "master_admin";
      }
      
      setCurrentUserRole(role);
    };

    checkRole();

    // 2. Combine real 'users' collection with fallback 'orders'
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

  const handleRoleChange = async (targetUserId: string, newRole: string, source: string) => {
    if (currentUserRole !== "master_admin") return;
    setUpdatingId(targetUserId);

    try {
      if (source === "users") {
        await updateDoc(doc(db, "users", targetUserId), {
          role: newRole,
          isAdmin: newRole === "admin" || newRole === "master_admin"
        });
      } else {
        // If changing role of legacy/affiliate, create a user doc for them
        const userToUpdate = users.find(u => u.id === targetUserId);
        if (userToUpdate) {
          const actualId = source === "orders" ? targetUserId.replace("legacy-", "") : targetUserId;
          await setDoc(doc(db, "users", actualId), {
            email: userToUpdate.email,
            name: userToUpdate.name,
            whatsapp: userToUpdate.whatsapp,
            role: newRole,
            isAdmin: newRole === "admin" || newRole === "master_admin",
            createdAt: new Date()
          }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Gagal memperbarui role.");
    } finally {
      setUpdatingId(null);
    }
  };

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
            {currentUserRole === 'master_admin' 
              ? "Anda adalah Master Admin. Anda dapat mengelola role seluruh pengguna." 
              : "Daftar pelanggan yang terdaftar di sistem."}
          </p>
        </div>
        
        {currentUserRole === 'master_admin' && (
          <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">Master Access Active</span>
          </div>
        )}
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
                {currentUserRole === 'master_admin' && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={currentUserRole === 'master_admin' ? 5 : 4} className="px-6 py-12 text-center text-foreground/50">
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
                          {user.role === 'master_admin' && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-card">
                              <Star className="w-2 h-2 text-white fill-white" />
                            </div>
                          )}
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
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${
                          user.role === 'master_admin' ? "bg-amber-500/20 text-amber-500 border border-amber-500/20" :
                          user.isAdmin || user.role === 'admin' ? "bg-primary/20 text-primary border border-primary/20" : 
                          "bg-blue-500/20 text-blue-500 border border-blue-500/20"
                        }`}>
                          {user.role === 'master_admin' && <ShieldCheck className="w-3 h-3" />}
                          {user.roleLabel || user.role || (user.isAdmin ? "Admin" : "Customer")}
                        </span>
                      </div>
                    </td>
                    {currentUserRole === 'master_admin' && (
                      <td className="px-6 py-4 text-right">
                        {user.email === "mienianid@gmail.com" ? (
                          <span className="text-[10px] font-bold text-foreground/20 italic">Protected</span>
                        ) : (
                          <select
                            disabled={updatingId === user.id}
                            value={user.role || (user.isAdmin ? "admin" : "customer")}
                            onChange={(e) => handleRoleChange(user.id, e.target.value, user.source)}
                            className="bg-background border border-white/10 rounded-lg text-xs p-1 focus:border-primary focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
                          >
                            <option value="customer">Set as Customer</option>
                            <option value="admin">Set as Admin</option>
                            <option value="master_admin">Set as Master</option>
                          </select>
                        )}
                        {updatingId === user.id && <Loader2 className="w-3 h-3 animate-spin inline ml-2 text-primary" />}
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-500 mb-1">Pusat Keamanan Admin</h4>
          <p className="text-xs text-foreground/50 leading-relaxed max-w-2xl">
            Role **Master Admin** memiliki otoritas penuh untuk menambah atau menghapus akses Admin lain. 
            Password tidak dapat dilihat oleh siapapun demi keamanan data pengguna. Gunakan fitur ini dengan bijak.
          </p>
        </div>
      </div>
    </div>
  );
}
