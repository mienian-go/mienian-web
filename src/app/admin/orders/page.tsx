"use client";

import { useState, useEffect } from "react";
import { Eye, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatRupiah } from "@/data/menu";
import Modal from "@/components/admin/Modal";
import { updateOrderStatus } from "@/lib/firestore";
import { motion } from "framer-motion";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingStatus, setSavingStatus] = useState(false);

  // Status mapping
  const statuses: Record<string, { label: string, color: string }> = {
    pending: { label: "Menunggu Upload", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
    payment_uploaded: { label: "Perlu Verifikasi", color: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
    verified: { label: "Lunas / Verified", color: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
    preparing: { label: "Persiapan", color: "bg-fuchsia-500/20 text-fuchsia-500 border-fuchsia-500/30" },
    completed: { label: "Selesai", color: "bg-green-500/20 text-green-500 border-green-500/30" },
    cancelled: { label: "Batal", color: "bg-red-500/20 text-red-500 border-red-500/30" },
  };

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (order: any) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    setSavingStatus(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      // Update local state for immediate feedback inside modal
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Gagal mengupdate status pesanan.");
    } finally {
      setSavingStatus(false);
    }
  };

  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

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
          <h1 className="text-3xl font-extrabold tracking-tight">Order Management</h1>
          <p className="text-foreground/50 mt-1">Verifikasi pembayaran dan detail event.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-semibold border ${
            statusFilter === "all" ? "bg-primary text-white border-primary" : "bg-transparent text-foreground/60 border-white/10 hover:bg-white/5"
          }`}
        >
          Semua Orders <span className="ml-1 opacity-50 px-1.5 bg-black/20 rounded-full">{orders.length}</span>
        </button>
        {Object.entries(statuses).map(([key, config]) => {
          const count = orders.filter(o => o.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-semibold border ${
                statusFilter === key ? `bg-white/10 text-white border-white/20` : "bg-transparent text-foreground/60 border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${config.color.split(" ")[0]}`}></span>
                {config.label}
                {count > 0 && <span className="ml-1 opacity-50 px-1.5 bg-black/20 rounded-full text-[10px]">{count}</span>}
              </div>
            </button>
          )
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/50 uppercase bg-muted/50 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">PIC & Event</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold text-center">Metode</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-foreground/50">
                    Tidak ada pesanan dengan status ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={order.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-primary">
                      {order.orderId}
                      <div className="text-[10px] text-foreground/40 mt-1">
                        {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("id-ID") : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{order.event?.picName}</div>
                      <div className="text-xs text-foreground/50 truncate max-w-[200px]" title={order.event?.venue}>
                        Tgl: {order.event?.date} — {order.event?.venue}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">
                      {formatRupiah(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                       {order.payment?.method ? (
                         <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-foreground/70">
                           {order.payment.method}
                         </span>
                       ) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1.5 rounded-md text-[11px] font-bold border uppercase tracking-wider flex items-center justify-center w-max gap-1.5 ${statuses[order.status]?.color || statuses.pending.color}`}>
                        {order.status === "payment_uploaded" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                        {statuses[order.status]?.label || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenModal(order)}
                        className="p-2 text-foreground/50 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors inline-block"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !savingStatus && setModalOpen(false)}
        title={`Order Details: ${selectedOrder?.orderId}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Details */}
              <div className="bg-muted/30 border border-white/5 rounded-2xl p-5 space-y-4 shadow-inner">
                <h4 className="font-bold text-sm uppercase tracking-wider text-foreground/50 border-b border-white/10 pb-2">Event Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-foreground/40 text-[10px] uppercase font-bold mb-0.5">PIC Name</span>
                    <p className="font-semibold">{selectedOrder.event?.picName}</p>
                  </div>
                  <div>
                    <span className="block text-foreground/40 text-[10px] uppercase font-bold mb-0.5">WhatsApp</span>
                    <a 
                      href={`https://wa.me/${selectedOrder.event?.whatsapp?.replace(/^0/, '62')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {selectedOrder.event?.whatsapp}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <span className="block text-foreground/40 text-[10px] uppercase font-bold mb-0.5">Date & Time</span>
                    <p className="font-medium">{selectedOrder.event?.date} (Jam {selectedOrder.event?.time})</p>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-foreground/40 text-[10px] uppercase font-bold mb-0.5">Venue</span>
                    <p className="bg-background/50 p-2 rounded text-xs">{selectedOrder.event?.venue}</p>
                  </div>
                  {selectedOrder.event?.notes && (
                    <div className="col-span-2">
                      <span className="block text-foreground/40 text-[10px] uppercase font-bold mb-0.5">Notes</span>
                      <p className="bg-amber-500/10 text-amber-500 p-2 rounded text-xs border border-amber-500/20">{selectedOrder.event?.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-muted/30 border border-white/5 rounded-2xl p-5 space-y-4 shadow-inner">
                 <h4 className="font-bold text-sm uppercase tracking-wider text-foreground/50 border-b border-white/10 pb-2">Pesanan ({selectedOrder.items?.length || 0} item)</h4>
                 <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                   {selectedOrder.items?.map((item: any, i: number) => (
                     <div key={i} className="flex justify-between items-start pb-3 border-b border-white/5 last:border-0 text-sm">
                       <div>
                         <p className="font-semibold">{item.quantity}x {item.packageName}</p>
                         <p className="text-xs text-foreground/50">Total Pax: {item.portions * item.quantity}</p>
                       </div>
                       <p className="font-mono text-primary font-medium">{formatRupiah(item.price * item.quantity)}</p>
                     </div>
                   ))}
                 </div>
                 <div className="flex justify-between items-center pt-3 border-t border-white/10">
                   <p className="font-bold">TOTAL TAGIHAN</p>
                   <p className="text-xl font-extrabold text-primary">{formatRupiah(selectedOrder.totalPrice)}</p>
                 </div>
              </div>
            </div>

            {/* Payment Verification Area */}
            <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Receipt View */}
                <div className="flex-shrink-0 w-full md:w-1/3">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-foreground/50 mb-3">Bukti Transfer</h4>
                  {selectedOrder.payment?.receiptUrl ? (
                    <a href={selectedOrder.payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-xl border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={selectedOrder.payment.receiptUrl} 
                        alt="Bukti Transfer" 
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="text-white text-xs font-bold flex items-center gap-1 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm"><ExternalLink className="w-3 h-3"/> Click to zoom</span>
                      </div>
                    </a>
                  ) : (
                    <div className="w-full h-48 bg-muted/50 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-foreground/40 text-sm">
                       Belum ada bukti yang diunggah.
                    </div>
                  )}
                  
                  {selectedOrder.payment?.senderName && (
                    <div className="mt-3 text-sm">
                      <span className="text-foreground/50 text-xs">Dikirim dari:</span>
                      <p className="font-semibold bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 mt-1">{selectedOrder.payment.senderName}</p>
                    </div>
                  )}
                </div>

                {/* Status Update Actions */}
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-foreground/50 mb-4 text-center md:text-left">Ubah Status Order</h4>
                  
                  {selectedOrder.status === "payment_uploaded" && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 p-3 rounded-lg text-sm mb-4 text-center">
                      User telah mengupload bukti. Silakan verifikasi!
                    </div>
                  )}

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(statuses).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(key)}
                        disabled={savingStatus || selectedOrder.status === key}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all relative overflow-hidden group ${
                          selectedOrder.status === key 
                            ? `${config.color.split(" ")[0]} text-white border-transparent` 
                            : `bg-transparent border-white/10 text-foreground/60 hover:bg-white/5 hover:border-white/20`
                        }`}
                      >
                        {savingStatus && selectedOrder.status !== key && <div className="absolute inset-0 bg-background/50 flex items-center justify-center"><Loader2 className="w-3 h-3 animate-spin"/></div>}
                        {config.label}
                      </button>
                    ))}
                  </div>

                  {selectedOrder.status === "verified" && (
                     <div className="mt-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex flex-col items-center justify-center text-center">
                       <p className="text-green-500 font-bold text-sm">Order Verified! ✅</p>
                       <p className="text-xs text-green-500/70 mt-1">Order masuk antrian persiapan tim katering.</p>
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
