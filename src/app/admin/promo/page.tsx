"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X as XIcon, RefreshCw, Loader2, Tag } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatRupiah } from "@/data/menu";
import Modal from "@/components/admin/Modal";
import { motion } from "framer-motion";

export default function PromoPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    type: "percent",
    value: 10,
    service: "both",
    isActive: true,
    expiryDate: "",
    maxUsage: 0,
    minPurchase: 0,
  });

  // Real-time listener for promos
  useEffect(() => {
    const q = query(collection(db, "promos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPromos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (promo: any = null) => {
    if (promo) {
      setEditingId(promo.id);
      
      let formattedDate = "";
      if (promo.expiryDate) {
        const dateObj = new Date(promo.expiryDate.seconds * 1000);
        // Format to YYYY-MM-DD
        formattedDate = dateObj.toISOString().split("T")[0];
      }

      setFormData({
        code: promo.code || "",
        type: promo.type || "percent",
        value: promo.value || 0,
        service: promo.service || "both",
        isActive: promo.isActive ?? true,
        expiryDate: formattedDate,
        maxUsage: promo.maxUsage || 0,
        minPurchase: promo.minPurchase || 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        code: "",
        type: "percent",
        value: 10,
        service: "both",
        isActive: true,
        expiryDate: "",
        maxUsage: 0,
        minPurchase: 0,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) return alert("Kode promo wajib diisi");
    
    setSaving(true);
    try {
      const payload: any = {
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: Number(formData.value),
        service: formData.service,
        isActive: formData.isActive,
        maxUsage: Number(formData.maxUsage) || null,
        minPurchase: Number(formData.minPurchase) || 0,
        updatedAt: Timestamp.now()
      };

      if (formData.expiryDate) {
        payload.expiryDate = Timestamp.fromDate(new Date(formData.expiryDate));
      } else {
        payload.expiryDate = null;
      }

      if (editingId) {
        // Update existing
        await updateDoc(doc(db, "promos", editingId), payload);
      } else {
        // Create new
        // Also initialize usageCount to 0
        payload.usageCount = 0;
        payload.createdAt = Timestamp.now();
        await addDoc(collection(db, "promos"), payload);
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Error saving promo:", err);
      alert("Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Yakin ingin menghapus promo "${code}"?`)) {
      try {
        await deleteDoc(doc(db, "promos", id));
      } catch (err) {
        console.error("Error deleting promo:", err);
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "promos", id), {
        isActive: !currentStatus,
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
          <h1 className="text-3xl font-extrabold tracking-tight">Manajemen Promo</h1>
          <p className="text-foreground/50 mt-1">Kelola diskon untuk Mienian GO dan Catering (Stall).</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Buat Promo Baru
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/50 uppercase bg-muted/50 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Kode Promo</th>
                <th className="px-6 py-4 font-semibold">Tipe & Value</th>
                <th className="px-6 py-4 font-semibold">Layanan</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Limit / Terpakai</th>
                <th className="px-6 py-4 font-semibold text-center">Expired</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {promos.map((promo) => (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={promo.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-primary font-mono tracking-widest text-lg">
                    {promo.code}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {promo.type === "percent" ? `${promo.value}%` : formatRupiah(promo.value)}
                    {promo.minPurchase > 0 && (
                      <div className="text-[10px] text-foreground/50 mt-1">Min: {formatRupiah(promo.minPurchase)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      promo.service === "go" ? "bg-amber-500/10 text-amber-500" : 
                      promo.service === "stall" ? "bg-blue-500/10 text-blue-500" : 
                      "bg-fuchsia-500/10 text-fuchsia-500"
                    }`}>
                      {promo.service === "both" ? "ALL" : promo.service}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleStatus(promo.id, promo.isActive)}
                      className={`inline-flex items-center justify-center p-1 rounded-full ${
                        promo.isActive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}
                      title={promo.isActive ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {promo.isActive ? <Check className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-xs">
                    <span className={promo.maxUsage && promo.usageCount >= promo.maxUsage ? "text-red-500 font-bold" : ""}>
                      {promo.usageCount || 0}
                    </span> / {promo.maxUsage ? promo.maxUsage : "∞"}
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-foreground/60">
                    {promo.expiryDate ? new Date(promo.expiryDate.seconds * 1000).toLocaleDateString("id-ID") : "No Expiry"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(promo)}
                        className="p-2 text-foreground/50 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id, promo.code)}
                        className="p-2 text-foreground/50 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {promos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-foreground/50">
                    Belum ada data promo. Klik "Buat Promo Baru" untuk mulai.
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
        title={editingId ? "Edit Promo" : "Buat Promo Baru"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground/70">Kode Promo (Otomatis Kapital)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="w-5 h-5 text-foreground/40" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '')})}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none font-mono uppercase tracking-widest"
                  placeholder="Misal: DISKON10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/70">Tipe Diskon</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              >
                <option value="percent">Persentase (%)</option>
                <option value="fixed">Nominal Rupiah (Rp)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/70">
                Nilai Diskon {formData.type === 'percent' ? '(%)' : '(Rp)'}
              </label>
              <input
                type="number"
                required
                min="0"
                max={formData.type === 'percent' ? "100" : undefined}
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground/70">Berlaku Untuk Layanan</label>
              <div className="flex gap-4 bg-background p-2 rounded-lg border border-white/10">
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded flex-1">
                  <input type="radio" name="service" value="go" checked={formData.service === "go"} onChange={() => setFormData({...formData, service: "go"})} className="text-primary" />
                  <span className="text-sm font-medium">Mienian GO</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded flex-1">
                  <input type="radio" name="service" value="stall" checked={formData.service === "stall"} onChange={() => setFormData({...formData, service: "stall"})} className="text-primary" />
                  <span className="text-sm font-medium">Stall (Catering)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded flex-1">
                  <input type="radio" name="service" value="both" checked={formData.service === "both"} onChange={() => setFormData({...formData, service: "both"})} className="text-primary" />
                  <span className="text-sm font-medium">Semua (ALL)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/70">Minimum Pembelian (Rp)</label>
              <input
                type="number"
                min="0"
                value={formData.minPurchase}
                onChange={(e) => setFormData({...formData, minPurchase: Number(e.target.value)})}
                placeholder="Opsional (Isi 0 jika tidak ada)"
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/70">Maksimal Penggunaan (Kuota)</label>
              <input
                type="number"
                min="0"
                value={formData.maxUsage}
                onChange={(e) => setFormData({...formData, maxUsage: Number(e.target.value)})}
                placeholder="Opsional (Isi 0 jika unlimited)"
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground/70">Tanggal Berakhir (Expired)</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              />
              <p className="text-[10px] text-foreground/40 mt-1">Kosongkan jika promo berlaku selamanya.</p>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 mt-2">
              <div>
                <p className="font-semibold text-sm">Status Aktif</p>
                <p className="text-xs text-foreground/50">Apakah promo bisa digunakan saat ini?</p>
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
              Simpan Promo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
