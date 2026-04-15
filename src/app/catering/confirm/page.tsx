"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import { Upload, Camera, X, ArrowRight, ArrowLeft, FileImage, Loader2 } from "lucide-react";
import Link from "next/link";
import { uploadFile } from "@/lib/storage";
import { createOrder } from "@/lib/firestore";

// Helper to generate a random 3-digit hex for order display ID
const generateOrderId = () => {
  return "MIENIAN-EVNT" + Math.floor(Math.random() * 1000).toString().padStart(3, "0");
};

export default function ConfirmPage() {
  const router = useRouter();
  const { state, dispatch } = useBooking();
  const c = state.calculations;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bankOrWallet, setBankOrWallet] = useState("");
  const [senderName, setSenderName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFile = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, file: "Ukuran file maks 5MB ya!" });
      return;
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(f.type)) {
      setErrors({ ...errors, file: "Format harus JPG atau PNG" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setErrors({ ...errors, file: "" });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!bankOrWallet.trim()) newErrors.bankOrWallet = "Wajib diisi";
    if (!senderName.trim()) newErrors.senderName = "Wajib diisi";
    if (!file) newErrors.file = "Upload bukti transfer dulu ya!";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting || !file) return;
    
    setIsSubmitting(true);
    try {
      // 1. Upload file to Firebase Storage
      const { url } = await uploadFile(file, "receipts");
      
      const orderDisplayId = generateOrderId();
      
      // 2. Prepare Order Data
      const orderData = {
        orderId: orderDisplayId,
        status: "payment_uploaded",
        items: state.packageId === "reguler" 
            ? [{ name: "Paket Reguler (A la carte)", qty: c.totalPorsi }] 
            : [{ name: state.packageId, qty: 1 }],
        totalPrice: c.grandTotal,
        event: {
            picName: state.name,
            whatsapp: state.whatsapp,
            date: state.date,
            time: state.time,
            venue: state.address,
            notes: `Stall: ${state.stallType}, Extras: ${state.komporType}, Meja: ${state.addTable}`
        },
        payment: {
          method: state.paymentType + " - " + bankOrWallet,
          bankOrWallet,
          senderName,
          receiptUrl: url,
        }
      };

      // 3. Save to Firestore
      const docId = await createOrder(orderData);
      
      // Navigate to success page (Success expects to read orderId from CartContext or self-generating. 
      // We'll pass it as URL param since we already removed CartContext from this page).
      router.push(`/catering/success?id=${docId}&orderId=${orderDisplayId}`);
    } catch (err) {
      console.error("Order creation failed:", err);
      alert("Gagal memproses order. Coba lagi atau hubungi admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (c.totalPorsi === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3">Belum Ada Pesanan</h2>
          <p className="text-foreground/50 mb-8">Pilih paket catering dulu ya!</p>
          <Link href="/catering/menu" className="btn btn-primary btn-lg">
            <ArrowLeft className="w-4 h-4" /> Lihat Menu
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
            Drop Bukti Transfer Lo di Sini 📸
          </h1>
          <p className="text-foreground/60 text-lg">
            Satu langkah terakhir! Upload struk biar sistem kita bisa langsung verifikasi orderan lo.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            {!preview ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`card p-12 border-2 border-dashed cursor-pointer text-center transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : errors.file
                    ? "border-primary"
                    : "border-card-border hover:border-primary/40"
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    {isDragging ? (
                      <Upload className="w-8 h-8 text-primary animate-bounce" />
                    ) : (
                      <Camera className="w-8 h-8 text-foreground/30" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold mb-1">
                      {isDragging ? "Drop di sini!" : "Klik buat upload atau drag & drop"}
                    </p>
                    <p className="text-foreground/40 text-sm">
                      Screenshot lo ke sini. (Format JPG/PNG, maks 5MB ya).
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="card p-4 relative">
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="rounded-xl overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="w-full max-h-80 object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 mt-3 text-sm text-foreground/60">
                  <FileImage className="w-4 h-4" />
                  <span>{file?.name}</span>
                  <span className="text-foreground/30">({(file!.size / 1024).toFixed(0)} KB)</span>
                </div>
              </div>
            )}
            {errors.file && <p className="text-primary text-xs mt-2">{errors.file}</p>}
          </motion.div>

          {/* Form Fields */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5 mb-10"
          >
            <div>
              <label className="block text-sm font-semibold mb-2">Transfer dari Bank/E-Wallet apa?</label>
              <input
                type="text"
                value={bankOrWallet}
                onChange={(e) => { setBankOrWallet(e.target.value); setErrors({ ...errors, bankOrWallet: "" }); }}
                placeholder="Contoh: BCA, GoPay, OVO, dll."
                className={`w-full px-4 py-3 rounded-xl bg-muted border ${errors.bankOrWallet ? "border-primary" : "border-transparent"} focus:border-primary focus:outline-none transition-colors text-sm`}
              />
              {errors.bankOrWallet && <p className="text-primary text-xs mt-1">{errors.bankOrWallet}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Atas Nama Pengirim</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => { setSenderName(e.target.value); setErrors({ ...errors, senderName: "" }); }}
                placeholder="Biar gampang dicek mutasinya di rekening kita."
                className={`w-full px-4 py-3 rounded-xl bg-muted border ${errors.senderName ? "border-primary" : "border-transparent"} focus:border-primary focus:outline-none transition-colors text-sm`}
              />
              {errors.senderName && <p className="text-primary text-xs mt-1">{errors.senderName}</p>}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg flex items-center justify-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Kirim & Validasi Order ✅
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
