"use client";

import { useEffect, useState } from "react";
import { getAffiliates, updateAffiliateStatus, deleteAffiliate } from "@/lib/firestore";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Users, Copy, Check, Trash2 } from "lucide-react";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  socialMedia: string;
  requestedCode: string;
  notes?: string;
  status: string;
  approvedCode: string;
  createdAt: any;
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const data = await getAffiliates();
      setAffiliates(data as Affiliate[]);
    } catch (err) {
      console.error("Error fetching affiliates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (aff: Affiliate) => {
    const code = codeInput.trim().toUpperCase() || aff.requestedCode?.toUpperCase() || aff.name.split(" ")[0].toUpperCase();
    if (!code) return alert("Masukkan kode affiliate terlebih dahulu.");
    setProcessing(aff.id);
    try {
      await updateAffiliateStatus(aff.id, "approved", code);
      await fetchData();
      setEditingId(null);
      setCodeInput("");
    } catch (err) {
      alert("Gagal approve. Coba lagi.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Yakin ingin menolak affiliator ini?")) return;
    setProcessing(id);
    try {
      await updateAffiliateStatus(id, "rejected");
      await fetchData();
    } catch (err) {
      alert("Gagal reject. Coba lagi.");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus affiliator ini permanen?")) return;
    setProcessing(id);
    try {
      await deleteAffiliate(id);
      await fetchData();
    } catch (err) {
      alert("Gagal menghapus. Coba lagi.");
    } finally {
      setProcessing(null);
    }
  };

  const copyLink = (code: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/menu/wedding?aff=${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = filter === "all" ? affiliates : affiliates.filter(a => a.status === filter);

  const counts = {
    all: affiliates.length,
    pending: affiliates.filter(a => a.status === "pending").length,
    approved: affiliates.filter(a => a.status === "approved").length,
    rejected: affiliates.filter(a => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kelola Affiliator</h1>
          <p className="text-foreground/50 mt-1">Review dan approve pendaftaran partner affiliate.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg">{counts.approved}</span>
          <span className="text-foreground/50">aktif</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === f
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-card border border-card-border text-foreground/60 hover:border-primary/40"
            }`}
          >
            {f === "all" ? "Semua" : f === "pending" ? "⏳ Menunggu" : f === "approved" ? "✅ Disetujui" : "❌ Ditolak"}
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-white/10">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-foreground/40">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold">Belum ada data affiliator{filter !== "all" ? ` dengan status "${filter}"` : ""}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((aff, i) => (
            <motion.div
              key={aff.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-lg">{aff.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      aff.status === "pending" ? "bg-amber-500/20 text-amber-500" :
                      aff.status === "approved" ? "bg-green-500/20 text-green-500" :
                      "bg-red-500/20 text-red-500"
                    }`}>
                      {aff.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-foreground/60">
                    <span>📧 {aff.email}</span>
                    <span>📱 {aff.whatsapp}</span>
                    <span>📸 {aff.socialMedia}</span>
                    {aff.requestedCode && <span>🏷️ Kode diminta: <b className="text-foreground">{aff.requestedCode}</b></span>}
                  </div>

                  {/* Approved Code & Link */}
                  {aff.status === "approved" && aff.approvedCode && (
                    <div className="mt-3 flex items-center gap-3 bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-2.5">
                      <span className="text-sm font-bold text-green-600">Kode: {aff.approvedCode}</span>
                      <button
                        onClick={() => copyLink(aff.approvedCode, aff.id)}
                        className="ml-auto flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                        {copiedId === aff.id ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Link</>}
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 sm:items-end shrink-0">
                  {aff.status === "pending" && (
                    <>
                      {editingId === aff.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={codeInput}
                            onChange={e => setCodeInput(e.target.value.toUpperCase())}
                            placeholder={aff.requestedCode || "KODE_AFFILIATE"}
                            className="w-full sm:w-48 px-3 py-2 rounded-lg border bg-muted text-sm font-bold tracking-widest focus:border-primary focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(aff)}
                              disabled={processing === aff.id}
                              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setCodeInput(""); }}
                              className="px-3 py-2 bg-card border border-card-border rounded-lg text-sm text-foreground/50 hover:text-foreground transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingId(aff.id); setCodeInput(aff.requestedCode || ""); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(aff.id)}
                            disabled={processing === aff.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600/10 text-red-500 rounded-lg text-sm font-bold hover:bg-red-600/20 disabled:opacity-50 transition-all"
                          >
                            <XCircle className="w-4 h-4" /> Tolak
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {editingId !== aff.id && (
                    <button
                      onClick={() => handleDelete(aff.id)}
                      disabled={processing === aff.id}
                      className="mt-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors w-max sm:w-full justify-end sm:justify-center disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus User
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
