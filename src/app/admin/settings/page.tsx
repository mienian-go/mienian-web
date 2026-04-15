"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/lib/firestore";
import { Save, AlertCircle, Building2, Phone, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import ImageUploader from "@/components/admin/ImageUploader";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    bankName: "",
    bankAccount: "",
    bankHolder: "",
    qrisImageUrl: "",
    whatsappNumber: "",
    instagramHandle: "",
    tiktokHandle: "",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        if (data) {
          setFormData({
            bankName: data.bankName || "BCA",
            bankAccount: data.bankAccount || "1234567890",
            bankHolder: data.bankHolder || "PT Mie Kekinian Sukses",
            qrisImageUrl: data.qrisImageUrl || "",
            whatsappNumber: data.whatsappNumber || "6285216706922",
            instagramHandle: data.instagramHandle || "@mienian_id",
            tiktokHandle: data.tiktokHandle || "@mienian_id",
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed saving settings:", err);
      alert("Gagal menyimpan perubahan. Pastikan rules Firestore sudah mengizinkan write.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Global Settings</h1>
          <p className="text-foreground/50 mt-1">
            Atur informasi pembayaran, kontak, dan sosial media.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Payment Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 sm:p-8"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-secondary" />
            Payment Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/70">
                  Nama Bank
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-muted/50 border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                  placeholder="Misal: BCA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/70">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-muted/50 border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono text-sm"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/70">
                  Atas Nama
                </label>
                <input
                  type="text"
                  name="bankHolder"
                  value={formData.bankHolder}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-muted/50 border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                  placeholder="PT Mie Kekinian Sukses"
                />
              </div>
            </div>

            <div className="bg-muted/10 p-5 rounded-xl border border-white/5">
              <label className="block text-sm font-medium mb-2 text-foreground/70">
                QRIS Image
              </label>
              <ImageUploader
                label="Upload QRIS Code Baru"
                folder="qris"
                currentUrl={formData.qrisImageUrl}
                onChange={(url) => setFormData((prev) => ({ ...prev, qrisImageUrl: url }))}
              />
              <p className="text-xs text-foreground/40 mt-3">
                Format disarankan: kotak (1:1), jelas dan mudah di-scan.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 sm:p-8"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Contact & Social Media
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/70">
                No. WhatsApp Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm font-mono"
                  placeholder="6285216706922"
                />
              </div>
              <p className="text-xs text-foreground/40 mt-2">
                Format pencetakan wa.me (Gunakan kode negara "62", tanpa "0" di depan).
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/70">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  name="instagramHandle"
                  value={formData.instagramHandle}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-muted/50 border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm font-mono"
                  placeholder="@mienian_id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/70">
                  TikTok Handle
                </label>
                <input
                  type="text"
                  name="tiktokHandle"
                  value={formData.tiktokHandle}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-muted/50 border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm font-mono"
                  placeholder="@mienian_id"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Submit Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-end gap-4"
        >
          {success && (
            <span className="text-sm text-green-500 flex items-center gap-1 font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Settings Saved!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary px-8 flex items-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </motion.div>
      </form>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mt-8">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-500/90">
          <p className="font-semibold mb-1">Penting: Firebase Rules</p>
          <p>
            Pastikan Firestore dan Storage Rules di Firebase Console sudah di-set untuk membolehkan read bagi semua pengguna, dan read/write bagi authenticated users. Jika tidak, operasi penyimpanan akan gagal (Permission Denied).
          </p>
        </div>
      </div>
    </div>
  );
}
