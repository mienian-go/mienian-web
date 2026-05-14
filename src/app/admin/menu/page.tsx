"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Check, X as XIcon, RefreshCw, Loader2, Upload, ImageIcon, Package, Minus } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatRupiah } from "@/data/menu";
import Modal from "@/components/admin/Modal";
import { motion } from "framer-motion";
import { uploadFile, deleteFile } from "@/lib/storage";
import Image from "next/image";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [refilling, setRefilling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    category: "mie",
    isActive: true,
    sortOrder: 0,
    stock: 0,
    imageUrl: "",
    imagePath: "",
  });

  const categories = [
    { id: "all", label: "Semua Menu" },
    { id: "mie", label: "Mie" },
    { id: "topping-reguler", label: "Topping Reguler" },
    { id: "topping-premium", label: "Topping Premium" },
    { id: "topping-super", label: "Topping Super" },
  ];

  useEffect(() => {
    const q = query(collection(db, "menu_items"), orderBy("sortOrder", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name || "",
        price: item.price || 0,
        category: item.category || "mie",
        isActive: item.isActive ?? true,
        sortOrder: item.sortOrder || 0,
        stock: item.stock ?? 0,
        imageUrl: item.imageUrl || "",
        imagePath: item.imagePath || "",
      });
      setImagePreview(item.imageUrl || null);
    } else {
      setEditingId(null);
      
      const cat = selectedCategory !== "all" ? selectedCategory : "mie";
      const catItems = menuItems.filter(m => m.category === cat);
      const nextSort = catItems.length > 0 
        ? Math.max(...catItems.map(m => m.sortOrder || 0)) + 10 
        : menuItems.length * 10;
        
      setFormData({
        name: "",
        price: 0,
        category: cat,
        isActive: true,
        sortOrder: nextSort,
        stock: 0,
        imageUrl: "",
        imagePath: "",
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran gambar maksimal 5MB.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = formData.imageUrl;
      let imagePath = formData.imagePath;

      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        // Delete old image if exists
        if (formData.imagePath) {
          await deleteFile(formData.imagePath);
        }
        const result = await uploadFile(imageFile, "menu-images");
        imageUrl = result.url;
        imagePath = result.path;
        setUploading(false);
      }

      const data = {
        ...formData,
        imageUrl,
        imagePath,
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "menu_items", editingId), data);
      } else {
        await addDoc(collection(db, "menu_items"), {
          ...data,
          createdAt: Timestamp.now(),
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Error saving menu item:", err);
      alert("Gagal menyimpan data.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus "${name}"?`)) {
      try {
        const item = menuItems.find(m => m.id === id);
        if (item?.imagePath) {
          await deleteFile(item.imagePath);
        }
        await deleteDoc(doc(db, "menu_items", id));
      } catch (err) {
        console.error("Error deleting menu item:", err);
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "menu_items", id), {
        isActive: !currentStatus,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const DEFAULT_STOCK: Record<string, number> = {
    "mie": 15,
    "topping-reguler": 10,
    "topping-premium": 5,
    "topping-super": 5,
  };

  const handleRefillAll = async () => {
    if (!confirm("Refill stok SEMUA KangDoMie ke default?\n\n• Mie: 15/item\n• Topping Reguler: 10/item\n• Topping Premium: 5/item\n• Topping Super: 5/item\n\nIni akan mereset inventory semua driver.")) return;
    setRefilling(true);
    try {
      // Build inventory template from menu items
      const inventory: Record<string, number> = {};
      for (const item of menuItems) {
        inventory[item.id] = DEFAULT_STOCK[item.category] ?? 10;
      }

      // Get all approved drivers and reset their inventory
      const { getDocs: gd, query: q, collection: col, where: w } = await import("firebase/firestore");
      const driversSnap = await gd(q(col(db, "kangdomie_drivers"), w("isApproved", "==", true)));
      for (const d of driversSnap.docs) {
        await updateDoc(doc(db, "kangdomie_drivers", d.id), {
          inventory,
          lastInventoryReset: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      alert(`Berhasil refill inventory ${driversSnap.docs.length} KangDoMie!`);
    } catch (err) {
      console.error("Refill error:", err);
      alert("Gagal refill stok.");
    }
    setRefilling(false);
  };

  // Filter items
  const filteredItems = selectedCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

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
          <h1 className="text-3xl font-extrabold tracking-tight">Katalog Menu GO</h1>
          <p className="text-foreground/50 mt-1">Kelola varian mie dan pilihan topping untuk Mienian GO.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefillAll}
            disabled={refilling}
            className="px-4 py-2 flex items-center gap-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold text-sm transition-colors disabled:opacity-50"
          >
            {refilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            Refill Stok
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Menu
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-semibold ${
              selectedCategory === cat.id 
                ? "bg-primary text-white" 
                : "bg-muted/50 text-foreground/60 hover:bg-muted"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/50 uppercase bg-muted/50 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold w-5">Sort</th>
                <th className="px-6 py-4 font-semibold w-14">Foto</th>
                <th className="px-6 py-4 font-semibold">Nama Item</th>
                <th className="px-6 py-4 font-semibold">Harga</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-6 py-4 text-foreground/40 font-mono">{item.sortOrder || 0}</td>
                  <td className="px-6 py-4">
                    {item.imageUrl ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 relative">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="40px" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-foreground/30" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{formatRupiah(item.price)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-white/5 text-foreground/70">
                      {item.category.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleStatus(item.id, item.isActive)}
                      className={`inline-flex items-center justify-center p-1 rounded-full ${
                        item.isActive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}
                      title={item.isActive ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {item.isActive ? <Check className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 text-foreground/50 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-2 text-foreground/50 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-foreground/50">
                    Tidak ada item di kategori ini.
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
        title={editingId ? "Edit Menu" : "Tambah Menu Baru"}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground/70">Foto Menu</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2"
            >
              {imagePreview ? (
                <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="400px" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold">Klik untuk ganti</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-5 h-5 text-foreground/40" />
                  </div>
                  <p className="text-xs text-foreground/50 text-center">Klik untuk upload foto menu<br/><span className="text-foreground/30">JPG, PNG maks. 5MB</span></p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            {uploading && <p className="text-xs text-primary mt-1 animate-pulse">Mengupload gambar...</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground/70">Nama Item</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              placeholder="Misal: Indomie Rendang"
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
            <label className="block text-sm font-medium mb-1 text-foreground/70">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
            >
              {categories.filter(c => c.id !== "all").map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
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

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground/70">Stok KangDoMie</label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
              className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              placeholder="Jumlah stok tersedia"
            />
            <p className="text-[10px] text-foreground/40 mt-1">Stok akan berkurang otomatis saat ada pembelian online/POS</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
            <div>
              <p className="font-semibold text-sm">Status Aktif</p>
              <p className="text-xs text-foreground/50">Tampilkan menu di website</p>
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
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
