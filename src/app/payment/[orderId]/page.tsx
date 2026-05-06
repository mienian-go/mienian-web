"use client";

import { useEffect, useState, use } from "react";
import { Copy, UploadCloud, CheckCircle2, AlertCircle, ReceiptText, MapPin, Calendar, Clock, Phone, User, Download } from "lucide-react";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { getSettings } from "@/lib/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import Image from "next/image";

export default function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  // Fix Next.js App Router params unwrapping issue
  const { orderId } = use(params);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [isDokuError, setIsDokuError] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const [docSnap, settings] = await Promise.all([
          getDoc(doc(db, "orders", orderId)),
          getSettings()
        ]);
        
        if (docSnap.exists()) {
          setOrder(docSnap.data());
        } else {
          setError("Pesanan tidak ditemukan.");
        }

        setGlobalSettings(settings);
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

  const [dokuLoading, setDokuLoading] = useState(false);

  const handleDokuPayment = async () => {
    setDokuLoading(true);
    try {
      const res = await fetch("/api/doku/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId,
          amount: order.costs?.grandTotal || 0,
          customerName: order.customerName || "Customer",
          customerEmail: order.email || "no-email@mienian.id",
          invoiceNumber: `INV-${orderId}-${Date.now().toString().slice(-6)}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pembayaran Doku");
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("URL pembayaran tidak ditemukan");
      }
    } catch (err: any) {
      alert("Gagal memproses Doku. Anda bisa menggunakan metode Transfer Manual.");
      setIsDokuError(true); // Fallback to manual if Doku fails
    } finally {
      setDokuLoading(false);
    }
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
           <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
             {success || order.status === "payment_verifying" ? "Tanda Terima (Receipt)" : "Menunggu Pembayaran"}
           </h1>
           <p className="text-sm text-foreground/60">
             {success || order.status === "payment_verifying" 
                ? "Pesanan Anda sedang dalam antrean verifikasi otomatis oleh admin kami." 
                : "Selesaikan pembayaran sesuai detail di bawah ini, lalu unggah bukti transaksinya agar dapat segera kami proses."}
           </p>
        </div>

        {success || (order.status === "payment_verifying" && !uploading) ? (
          <div className="bg-card rounded-3xl border border-card-border shadow-xl overflow-hidden mb-8 relative">
             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <ReceiptText className="w-48 h-48" />
             </div>
             
             {/* Receipt Header */}
             <div className="bg-primary p-6 sm:p-8 text-center text-white relative">
                <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-full mb-3 backdrop-blur-sm">
                   <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">Menunggu Verifikasi</h2>
                <p className="text-white/80 text-sm mt-1">Bukti transfer Anda telah kami terima.</p>
             </div>

             <div className="p-6 sm:p-8">
                {/* Order Details */}
                <div className="border-b border-dashed border-card-border pb-6 mb-6">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider mb-1">Order ID</p>
                         <p className="font-mono font-bold text-lg text-primary">#{orderId.substring(0,8).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider mb-1">Tanggal Pesanan</p>
                         <p className="font-bold text-sm">{new Date(order.createdAt?.toMillis ? order.createdAt.toMillis() : Date.now()).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                      </div>
                   </div>

                   <div className="bg-muted rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-3">
                         <User className="w-4 h-4 text-primary shrink-0" />
                         <span className="font-bold">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <Phone className="w-4 h-4 text-primary shrink-0" />
                         <span className="font-bold">{order.whatsapp}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <Calendar className="w-4 h-4 text-primary shrink-0" />
                         <span className="font-bold">{order.eventDate} <span className="text-foreground/50 font-normal">({order.eventTime})</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <MapPin className="w-4 h-4 text-primary shrink-0" />
                         <span className="font-bold line-clamp-1">{order.city} - {order.distanceKm}km</span>
                      </div>
                   </div>
                </div>

                {/* Items Breakdown */}
                <div className="mb-6">
                   <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider mb-4">Rincian Paket Catering</p>
                   {/* Loop Over Items if we stored them */}
                   <div className="space-y-3">
                      {(order.items?.mie || []).map((m: any, i: number) => m.qty > 0 && (
                         <div key={i} className="flex justify-between text-sm">
                            <span>{m.name} <span className="text-foreground/50">x{m.qty}</span></span>
                            <span className="font-bold flex-shrink-0">Rp {(Number(m.qty) * 10000).toLocaleString('id-ID')}</span>
                         </div>
                      ))}
                      {(order.items?.toppingReg || []).map((m: any, i: number) => m.qty > 0 && (
                         <div key={i} className="flex justify-between text-sm text-foreground/80">
                            <span>{m.name} <span className="text-foreground/50">x{m.qty}</span></span>
                            <span className="font-bold flex-shrink-0">Rp {(Number(m.qty) * 5000).toLocaleString('id-ID')}</span>
                         </div>
                      ))}
                      {(order.items?.toppingPrem || []).map((m: any, i: number) => m.qty > 0 && (
                         <div key={i} className="flex justify-between text-sm text-foreground/80">
                            <span>{m.name} <span className="text-foreground/50">x{m.qty}</span></span>
                            <span className="font-bold flex-shrink-0">Rp {(Number(m.qty) * 8000).toLocaleString('id-ID')}</span>
                         </div>
                      ))}
                      {(order.items?.toppingSuper || []).map((m: any, i: number) => m.qty > 0 && (
                         <div key={i} className="flex justify-between text-sm text-foreground/80">
                            <span>{m.name} <span className="text-foreground/50">x{m.qty}</span></span>
                            <span className="font-bold flex-shrink-0">Rp {(Number(m.qty) * 13000).toLocaleString('id-ID')}</span>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Costs Breakdown */}
                <div className="border-t border-dashed border-card-border pt-4 mb-6 space-y-3 text-sm text-foreground/70">
                   {order.costs?.extraFee > 0 && (
                     <div className="flex justify-between">
                        <span>Pilihan Stall ({order.stallType})</span>
                        <span className="font-bold text-foreground">Rp {order.costs.extraFee.toLocaleString('id-ID')}</span>
                     </div>
                   )}
                   {order.costs?.staffFee > 0 && (
                     <div className="flex justify-between">
                        <span>Layanan Staf (x{order.costs.totalStaff})</span>
                        <span className="font-bold text-foreground">Rp {order.costs.staffFee.toLocaleString('id-ID')}</span>
                     </div>
                   )}
                   {order.costs?.transportFee > 0 && (
                     <div className="flex justify-between">
                        <span>Ongkos Transport ({order.distanceKm} KM)</span>
                        <span className="font-bold text-foreground">Rp {order.costs.transportFee.toLocaleString('id-ID')}</span>
                     </div>
                   )}
                </div>

                {/* Grand Total */}
                <div className="bg-primary/5 rounded-2xl p-5 flex items-center justify-between">
                   <span className="font-bold text-primary">Total Pembayaran</span>
                   <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">Rp {order.costs?.grandTotal?.toLocaleString("id-ID") || 0}</span>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                   <Link href="/catering" className="flex-1 btn btn-outlined bg-card hover:bg-muted py-3 justify-center text-sm">
                      Kembali ke Beranda
                   </Link>
                   <button onClick={() => window.print()} className="flex-1 btn btn-primary py-3 justify-center text-sm gap-2">
                      <Download className="w-4 h-4"/>
                      Simpan / Cetak Struk
                   </button>
                </div>
                
                {/* Upload Ulang Button (Optional Escape Hatch) */}
                <div className="mt-6 text-center">
                   <button onClick={() => { setSuccess(false); setOrder({...order, status: "pending_payment"}); }} className="text-[11px] text-foreground/40 hover:text-primary transition-colors underline">
                     Terjadi kesalahan transfer? Unggah ulang bukti
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-card rounded-3xl border border-card-border shadow-xl overflow-hidden mb-8">
             {/* Order Total Block */}
             <div className="bg-primary/10 p-6 sm:p-8 text-center border-b border-primary/20">
               <p className="text-sm font-bold text-primary mb-1">TOTAL TAGIHAN</p>
               <h2 className="text-4xl font-extrabold tracking-tight">Rp {order.costs?.grandTotal?.toLocaleString("id-ID") || 0}</h2>
               <p className="text-xs text-foreground/50 mt-2">Order ID: #{orderId.substring(0,8).toUpperCase()}</p>
             </div>

             <div className="p-6 sm:p-8 space-y-8">
                {/* Doku Payment */}
                <div>
                   <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">1</div>
                     Pembayaran Otomatis (Virtual Account / E-Wallet / CC)
                   </h3>
                   <div className="bg-muted p-6 rounded-xl border border-card-border flex flex-col items-center justify-center text-center">
                      <p className="text-sm font-bold text-foreground mb-2">DOKU Payment Gateway</p>
                      <p className="text-xs text-foreground/60 mb-4">Bayar praktis tanpa perlu upload bukti transfer. Konfirmasi otomatis.</p>
                      <button onClick={handleDokuPayment} disabled={dokuLoading} className="w-full py-3 bg-[#E32526] text-white font-bold rounded-xl disabled:opacity-50 hover:opacity-90 transition-all flex justify-center items-center gap-2 shadow-lg">
                         {dokuLoading ? "Memproses..." : "Bayar via Doku Sekarang"}
                      </button>
                   </div>
                </div>

                {/* Conditionally show manual payment if enabled in settings OR if Doku throws an error */}
                {(globalSettings?.enableManualPayment || isDokuError) && (
                  <>
                    <div className="flex items-center gap-4 py-2">
                      <div className="h-px bg-card-border flex-1"></div>
                      <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">ATAU TRANSFER MANUAL</span>
                      <div className="h-px bg-card-border flex-1"></div>
                    </div>

                    {/* Manual Bank Transfer */}
                    <div>
                       <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">2</div>
                         Transfer Bank Manual
                       </h3>
                       <div className="bg-muted p-4 rounded-xl border border-card-border">
                          <p className="text-xs text-foreground/60 mb-1">{globalSettings?.bankName || "Bank Syariah Indonesia (BSI)"}</p>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xl font-bold tracking-widest text-primary">{globalSettings?.bankAccount || "8777767896"}</span>
                            <button onClick={() => copyToClipboard(globalSettings?.bankAccount || "8777767896")} className="p-2 bg-card hover:bg-card-border rounded-lg text-foreground/50 transition-colors">
                               <Copy className="w-4 h-4"/>
                            </button>
                          </div>
                          <p className="text-sm font-bold text-foreground">a/n {globalSettings?.bankHolder || "PT Mie Kekinian Sukses"}</p>
                       </div>
                    </div>

                    {/* QRIS */}
                    <div>
                       <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">3</div>
                         Via QRIS Manual (Semua E-Wallet/M-Banking)
                       </h3>
                       <div className="bg-white p-6 rounded-xl border border-card-border flex flex-col items-center">
                          <div className="w-full max-w-[250px] aspect-square relative mb-3 bg-muted/30 rounded-lg overflow-hidden border">
                             <Image src={globalSettings?.qrisImageUrl || "/qris.jpg"} alt="QRIS Mienian" fill className="object-contain" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/250?text=QRIS+Not+Found+in+/public'; }} />
                          </div>
                          <p className="text-[10px] text-center text-black/40">Pastikan atas nama {globalSettings?.bankHolder || "PT Mie Kekinian Sukses"} saat melakukan scan.</p>
                       </div>
                    </div>

                    {/* Upload Bukti */}
                    <div className="pt-4 border-t border-dashed border-card-border">
                       <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">4</div>
                         Unggah Bukti Transfer Manual
                       </h3>
                       <div className="space-y-4">
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
                    </div>
                  </>
                )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
