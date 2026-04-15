"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X as XIcon, RefreshCw, Loader2 } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatRupiah } from "@/data/menu";
import Modal from "@/components/admin/Modal";
import { motion } from "framer-motion";

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    portions: 0,
    description: "",
    category: "wedding",
    isActive: true,
    comingSoon: false,
    sortOrder: 0,
  });

  // Real-time listener for packages
  useEffect(() => {
    const q = query(collection(db, "catering_packages"), orderBy("sortOrder", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (pkg: any = null) => {
    if (pkg) {
      setEditingId(pkg.id);
      setFormData({
        name: pkg.name || "",
        price: pkg.price || 0,
        portions: pkg.portions || 0,
        description: pkg.description || "",
        category: pkg.category || "wedding",
        isActive: pkg.isActive ?? true,
        comingSoon: pkg.comingSoon ?? false,
        sortOrder: pkg.sortOrder || 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        price: 0,
        portions: 100,
        description: "",
        category: "wedding",
        isActive: true,
        comingSoon: false,
        sortOrder: packages.length * 10,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        // Update existing
        await updateDoc(doc(db, "catering_packages", editingId), {
          ...formData,
          updatedAt: Timestamp.now()
        });
      } else {
        // Create new
        await addDoc(collection(db, "catering_packages"), {
          ...formData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Error saving package:", err);
      alert("Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus paket "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "catering_packages", id));
      } catch (err) {
        console.error("Error deleting package:", err);
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean, field: "isActive" | "comingSoon") => {
    try {
      await updateDoc(doc(db, "catering_packages", id), {
        [field]: !currentStatus,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

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
          <h1 className="text-3xl font-extrabold tracking-tight">Catering Packages</h1>
          <p className="text-foreground/50 mt-1">Kelola paket Wedding & Corporate.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Paket
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/50 uppercase bg-muted/50 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold w-5">Sort</th>
                <th className="px-6 py-4 font-semibold">Nama Paket</th>
                <th className="px-6 py-4 font-semibold">Harga</th>
                <th className="px-6 py-4 font-semibold">Porsi</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Coming Soon</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {packages.map((pkg) => (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={pkg.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-6 py-4 text-foreground/40 font-mono">{pkg.sortOrder}</td>
                  <td className="px-6 py-4 font-semibold">
                    {pkg.name}
                    {pkg.description && (
                      <p className="text-xs text-foreground/40 font-normal mt-1 truncate max-w-[200px]" title={pkg.description}>
                        {pkg.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{formatRupiah(pkg.price)}</td>
                  <td className="px-6 py-4">{pkg.portions} pax</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      pkg.category === "wedding" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                    }`}>
                      {pkg.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleStatus(pkg.id, pkg.isActive, "isActive")}
                      className={`inline-flex items-center justify-center p-1 rounded-full ${
                        pkg.isActive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}
                      title={pkg.isActive ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {pkg.isActive ? <Check className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleStatus(pkg.id, pkg.comingSoon, "comingSoon")}
                      className={`text-xs font-bold px-2 py-1 rounded border transition-colors ${
                        pkg.comingSoon 
                          ? "bg-secondary/20 text-secondary border-secondary/30" 
                          : "bg-transparent text-foreground/30 border-white/10 hover:border-secondary hover:text-secondary"
                      }`}
                    >
                      {pkg.comingSoon ? "YES" : "NO"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(pkg)}
                        className="p-2 text-foreground/50 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id, pkg.name)}
                        className="p-2 text-foreground/50 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-foreground/50">
                    Belum ada data paket. Klik "Tambah Paket" untuk mulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingId ? "Edit Paket" : "Tambah Paket Baru"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground/70">Nama Paket</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
                placeholder="Misal: Mie Satu Topping"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/70">Harga (Rp)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/70">Jumlah Porsi</label>
              <input
                type="number"
                required
                min="0"
                value={formData.portions}
                onChange={(e) => setFormData({...formData, portions: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/70">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              >
                <option value="wedding">Paket Wedding</option>
                <option value="corporate">Paket Corporate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/70">Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({...formData, sortOrder: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground/70">Deskripsi</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none resize-none"
                placeholder="Detail isi paket"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
              <div>
                <p className="font-semibold text-sm">Status Aktif</p>
                <p className="text-xs text-foreground/50">Tampilkan paket di website</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
              <div>
                <p className="font-semibold text-sm text-secondary">Label "Coming Soon"</p>
                <p className="text-xs text-foreground/50">Disable checkout, un-clickable</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.comingSoon}
                  onChange={(e) => setFormData({...formData, comingSoon: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-muted text-white hover:bg-white/20 transition-colors text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
