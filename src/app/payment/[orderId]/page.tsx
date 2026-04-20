"use client";

import { useEffect, useState, use } from "react";
import { Copy, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import Image from "next/image";

export default function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  // Fix Next.js App Router params unwrapping issue
  const { orderId } = use(params);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const docSnap = await getDoc(doc(db, "orders", orderId));
        if (docSnap.exists()) {
          setOrder(docSnap.data());
        } else {
          setError("Pesanan tidak ditemukan.");
        }
      } catch (err: any) {
        setError(err.message || "Gagal memuat detail pesanan.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Berhasil disalin ke clipboard!");
  };

  const handleUpload = async () => {
    if (!file) return alert("Pilih file bukti pembayaran terlebih dahulu.");
    setUploading(true);
    try {
      // Create safe filename
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `receipts/${orderId}_${Date.now()}.${ext}`);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Update Order Status
      await updateDoc(doc(db, "orders", orderId), {
        status: "payment_verifying",
        receiptUrl: url,
        paymentDate: new Date().toISOString()
      });

      setSuccess(true);
    } catch (err: any) {
      alert("Gagal mengunggah: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-32 flex justify-center text-foreground/50">Memeriksa tagihan...</div>;
  if (error) return <div className="min-h-screen pt-32 flex justify-center text-red-500">{error}</div>;
  if (!order) return <div className="min-h-screen pt-32 flex justify-center">Order Invalid.</div>;

  return (
    <div className="min-h-screen bg-muted/30 pt-28 pb-24">
      <div className="max-w-xl mx-auto px-4">
        
        <div className="text-center mb-8">
           <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Menunggu Pembayaran</h1>
           <p className="text-sm text-foreground/60">Selesaikan pembayaran sesuai detail di bawah ini, lalu unggah bukti transaksinya agar dapat segera kami proses.</p>
        </div>

        <div className="bg-card rounded-3xl border border-card-border shadow-xl overflow-hidden mb-8">
           {/* Order Total Block */}
           <div className="bg-primary/10 p-6 sm:p-8 text-center border-b border-primary/20">
             <p className="text-sm font-bold text-primary mb-1">TOTAL TAGIHAN</p>
             <h2 className="text-4xl font-extrabold tracking-tight">Rp {order.costs?.grandTotal?.toLocaleString("id-ID") || 0}</h2>
             <p className="text-xs text-foreground/50 mt-2">Order ID: #{orderId.substring(0,8).toUpperCase()}</p>
           </div>

           <div className="p-6 sm:p-8 space-y-8">
              
              {/* Manual Bank Transfer */}
              <div>
                 <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">1</div>
                   Transfer Bank Manual
                 </h3>
                 <div className="bg-muted p-4 rounded-xl border border-card-border">
                    <p className="text-xs text-foreground/60 mb-1">Bank Syariah Indonesia (BSI)</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-bold tracking-widest text-primary">8777767896</span>
                      <button onClick={() => copyToClipboard("8777767896")} className="p-2 bg-card hover:bg-card-border rounded-lg text-foreground/50 transition-colors">
                         <Copy className="w-4 h-4"/>
                      </button>
                    </div>
                    <p className="text-sm font-bold text-foreground">a/n PT Mie Kekinian Sukses</p>
                 </div>
              </div>

              {/* QRIS */}
              <div>
                 <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">2</div>
                   Atau via QRIS (Semua E-Wallet/M-Banking)
                 </h3>
                 <div className="bg-white p-6 rounded-xl border border-card-border flex flex-col items-center">
                    {/* The QRIS image provided by the user. If they provide exactly "qris.jpg" into public dir */}
                    <div className="w-full max-w-[250px] aspect-square relative mb-3 bg-muted/30 rounded-lg overflow-hidden border">
                       <Image src="/qris.jpg" alt="QRIS Mienian" fill className="object-contain" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/250?text=QRIS+Not+Found+in+/public'; }} />
                    </div>
                    <p className="text-[10px] text-center text-black/40">Pastikan atas nama PT Mie Kekinian Sukses saat melakukan scan.</p>
                 </div>
              </div>

              {/* Upload Bukti */}
              <div className="pt-4 border-t border-dashed border-card-border">
                 <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">3</div>
                   Unggah Bukti Transfer
                 </h3>

                 {success ? (
                    <div className="bg-green-500/10 border border-green-500/30 p-5 rounded-xl text-center">
                       <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                       <h4 className="font-bold text-green-600 mb-1">Bukti Berhasil Diunggah!</h4>
                       <p className="text-xs text-green-600/80">Admin kami akan segera meninjau dan mengkonfirmasi pesanan Anda melalui WhatsApp.</p>
                       <Link href="/catering" className="mt-4 inline-block px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-bold w-full">Kembali Kunjungi Beranda</Link>
                    </div>
                 ) : (
                    <div className="space-y-4">
                      {order.status === "payment_verifying" && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-yellow-700">Anda sudah mengunggah bukti untuk pesanan ini. Anda bisa mengunggah ulang jika terdapat kesalahan.</div>
                        </div>
                      )}
                      <label className="flex items-center justify-center w-full h-32 px-4 transition bg-card border-2 border-primary/20 border-dashed rounded-xl appearance-none cursor-pointer hover:border-primary/50 focus:outline-none">
                          <div className="flex flex-col items-center space-y-2">
                            <UploadCloud className="w-6 h-6 text-foreground/40" />
                            <span className="font-medium text-foreground/60 text-sm">
                              {file ? file.name : "Klik untuk memilih foto (JPG/PNG/PDF)"}
                            </span>
                          </div>
                          <input type="file" name="file_upload" className="hidden" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      </label>
                      <button onClick={handleUpload} disabled={!file || uploading} className="w-full py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-all flex justify-center items-center gap-2">
                         {uploading ? "Sedang Mengunggah..." : "Konfirmasi Pembayaran"}
                      </button>
                    </div>
                 )}
              </div>

           </div>
        </div>

      </div>
    </div>
  );
}
