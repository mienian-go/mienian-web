"use client";

import { useEffect, useState } from "react";
import { getAdmins, deleteAdmin, AdminUser, AdminRole } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Shield, ShieldAlert, Plus, Trash2, Edit } from "lucide-react";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminsPage() {
  const { role, user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ uid: "", email: "", name: "", role: "staff" as AdminRole });

  const load = async () => {
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) load();
  }, [role]);

  const handleSave = async () => {
    if (!form.uid || !form.email || !form.name) return alert("Semua field wajib diisi!");
    try {
      await setDoc(doc(db, "admins", form.uid), {
        email: form.email,
        name: form.name,
        role: form.role,
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      }, { merge: true });
      setShowModal(false);
      load();
    } catch (err) {
      alert("Gagal menyimpan admin");
    }
  };

  const handleDelete = async (uid: string, name: string) => {
    if (uid === currentUser?.uid) return alert("Anda tidak bisa menghapus diri sendiri!");
    if (!confirm(`Hapus hak akses admin untuk ${name}?`)) return;
    try {
      await deleteAdmin(uid);
      setAdmins(admins.filter((a) => a.id !== uid));
    } catch (err) {
      alert("Gagal menghapus admin");
    }
  };

  if (role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Akses Ditolak</h2>
        <p className="text-foreground/50 max-w-md mx-auto mt-2">
          Hanya Superadmin yang memiliki hak untuk mengelola role dan menambahkan admin baru.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manajemen Admin</h1>
          <p className="text-foreground/50 mt-1">Kelola hak akses dashboard untuk tim Anda.</p>
        </div>
        <button
          onClick={() => {
            setForm({ uid: "", email: "", name: "", role: "staff" });
            setShowModal(true);
          }}
          className="btn btn-primary shadow-lg"
        >
          <Plus className="w-4 h-4" /> Tambah Admin
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-sm text-amber-600">
        <strong>Penting:</strong> Menambahkan data di sini hanya memberikan hak akses. Anda tetap harus membuatkan akun email & password-nya secara manual di Firebase Console &gt; Authentication. Pastikan UID yang dimasukkan sama persis.
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-foreground/50 uppercase bg-muted/50 border-b border-card-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama / Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">UID Firebase</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground flex items-center gap-2">
                        {admin.id === currentUser?.uid && (
                          <span className="w-2 h-2 rounded-full bg-green-500" title="You" />
                        )}
                        {admin.name}
                      </div>
                      <div className="text-xs text-foreground/40">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        admin.role === "superadmin" ? "bg-fuchsia-500/15 text-fuchsia-500" :
                        admin.role === "content_writer" ? "bg-blue-500/15 text-blue-500" :
                        "bg-primary/15 text-primary"
                      }`}>
                        {admin.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-foreground/40">{admin.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setForm({ uid: admin.id, email: admin.email, name: admin.name, role: admin.role });
                            setShowModal(true);
                          }}
                          className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center hover:bg-secondary/20"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id, admin.name)}
                          disabled={admin.id === currentUser?.uid}
                          className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{form.uid && admins.some(a => a.id === form.uid) ? "Edit Admin" : "Tambah Admin"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-1">UID Firebase Auth</label>
                <input
                  type="text"
                  value={form.uid}
                  onChange={(e) => setForm({ ...form, uid: e.target.value })}
                  disabled={admins.some(a => a.id === form.uid)} // Cannot edit UID of existing
                  placeholder="e.g. xYzA123..."
                  className="w-full p-3 rounded-lg border border-card-border bg-background focus:border-primary focus:outline-none font-mono text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 rounded-lg border border-card-border bg-background focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-3 rounded-lg border border-card-border bg-background focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-1">Role Akses</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
                  className="w-full p-3 rounded-lg border border-card-border bg-background focus:border-primary focus:outline-none"
                >
                  <option value="superadmin">Superadmin (Akses Penuh)</option>
                  <option value="staff">Staff (Orders & Menu)</option>
                  <option value="content_writer">Content Writer (Blog Saja)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn btn-outlined flex-1">Batal</button>
              <button onClick={handleSave} className="btn btn-primary flex-1">Simpan</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
