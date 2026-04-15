"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/data/menu";
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();
  const { state, dispatch, totalPrice, totalItems } = useCart();
  const [formData, setFormData] = useState({
    picName: "",
    whatsapp: "",
    date: "",
    time: "",
    venue: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.picName.trim()) newErrors.picName = "Nama PIC wajib diisi";
    if (!formData.whatsapp.trim()) newErrors.whatsapp = "No. WhatsApp wajib diisi";
    if (!formData.date) newErrors.date = "Tanggal acara wajib diisi";
    if (!formData.time) newErrors.time = "Jam standby wajib diisi";
    if (!formData.venue.trim()) newErrors.venue = "Lokasi venue wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalItems === 0) return;
    if (!validate()) return;
    dispatch({
      type: "SET_EVENT_DETAILS",
      payload: formData,
    });
    router.push("/catering/payment");
  };

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-foreground/20" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Keranjang Masih Kosong</h2>
          <p className="text-foreground/50 mb-8">Belum ada paket yang dipilih. Yuk pilih paket catering dulu!</p>
          <Link href="/catering/menu" className="btn btn-primary btn-lg">
            <ArrowLeft className="w-4 h-4" />
            Lihat Menu & Paket
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
            Spill Detail Acara Lo Sini 🎯
          </h1>
          <p className="text-foreground/60 text-lg">
            Biar kru Mienian bisa prepare maksimal buat live cooking di venue lo.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* ===== LEFT: Order Summary ===== */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <div className="card p-6 sm:p-8 sticky top-24">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Cek Ombak Dulu
                  <span className="text-foreground/40 text-sm font-normal">(Order Summary)</span>
                </h2>

                <div className="space-y-4 mb-6">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 pb-4 border-b border-card-border">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                        <p className="text-foreground/50 text-xs">{item.portions} porsi</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.id, quantity: item.quantity - 1 } })}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.id, quantity: item.quantity + 1 } })}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatRupiah(item.price * item.quantity)}</p>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
                          className="text-xs text-primary/60 hover:text-primary flex items-center gap-1 mt-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-card-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground/60">Total Harga</span>
                    <span className="text-2xl font-extrabold text-primary">{formatRupiah(totalPrice)}</span>
                  </div>
                  <p className="text-xs text-foreground/40">Udah transparan, no hidden fee club! ✌️</p>
                </div>
              </div>
            </motion.div>

            {/* ===== RIGHT: Event Form ===== */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <div className="card p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6">Detail Acara</h2>

                <div className="space-y-5">
                  {/* PIC Name */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nama PIC</label>
                    <input
                      type="text"
                      name="picName"
                      value={formData.picName}
                      onChange={handleChange}
                      placeholder="Panggil aja gue..."
                      className={`w-full px-4 py-3 rounded-xl bg-muted border ${errors.picName ? "border-primary" : "border-transparent"} focus:border-primary focus:outline-none transition-colors text-sm`}
                    />
                    {errors.picName && <p className="text-primary text-xs mt-1">{errors.picName}</p>}
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">No. WhatsApp</label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="Nomor WA yang fast response ya!"
                      className={`w-full px-4 py-3 rounded-xl bg-muted border ${errors.whatsapp ? "border-primary" : "border-transparent"} focus:border-primary focus:outline-none transition-colors text-sm`}
                    />
                    {errors.whatsapp && <p className="text-primary text-xs mt-1">{errors.whatsapp}</p>}
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Tanggal Acara</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl bg-muted border ${errors.date ? "border-primary" : "border-transparent"} focus:border-primary focus:outline-none transition-colors text-sm`}
                      />
                      {errors.date && <p className="text-primary text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Jam Standby</label>
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl bg-muted border ${errors.time ? "border-primary" : "border-transparent"} focus:border-primary focus:outline-none transition-colors text-sm`}
                      />
                      {errors.time && <p className="text-primary text-xs mt-1">{errors.time}</p>}
                    </div>
                  </div>

                  {/* Venue */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Lokasi / Venue</label>
                    <textarea
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Share loc atau ketik alamat lengkap venue lo."
                      className={`w-full px-4 py-3 rounded-xl bg-muted border ${errors.venue ? "border-primary" : "border-transparent"} focus:border-primary focus:outline-none transition-colors text-sm resize-none`}
                    />
                    <p className="text-xs text-foreground/40 mt-1">
                      📌 Catatan: Kru kita baru bisa take over area Jakarta, Bandung, Semarang, dan Yogyakarta ya, bestie!
                    </p>
                    {errors.venue && <p className="text-primary text-xs mt-1">{errors.venue}</p>}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Notes Tambahan</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Ada request khusus? (Misal: Level pedes dipisah, butuh meja tambahan, dll.)"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" className="btn btn-primary btn-lg w-full mt-8">
                  Bungkus & Lanjut Bayar 🔥
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}
