"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMonthlyAttendance, getDriverCommissionForPeriod, getDateRange, type Attendance } from "@/lib/firestoreDriverSales";
import { Loader2, CheckCircle2, XCircle, Truck, MapPin, Phone, User, Trash2, Shield, Hash, Edit3, QrCode, Eye, Calendar, DollarSign, TrendingUp, Briefcase, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Driver {
  uid: string;
  name: string;
  phone: string;
  gerobakId: string;
  isOnline: boolean;
  isApproved: boolean;
  createdAt: any;
  photoURL?: string;
  totalSales?: number;
  totalCommission?: number;
  workDays?: number;
  qrCode?: string;
}

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

type TabType = "drivers" | "profiles" | "attendance";

export default function AdminKangDoMiePage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("drivers");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverAttendance, setDriverAttendance] = useState<Attendance[]>([]);
  const [driverCommission, setDriverCommission] = useState({ totalSales: 0, totalCommission: 0, count: 0 });

  const fetchDrivers = async () => {
    try {
      const q = query(collection(db, "kangdomie_drivers"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setDrivers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as Driver)));
    } catch (err) {
      console.error("Error fetching drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const toggleApproval = async (uid: string, currentStatus: boolean, gerobakId?: string) => {
    if (!currentStatus && !gerobakId) {
      alert("Harap isi ID Gerobak sebelum approve!");
      return;
    }
    setProcessing(uid);
    try {
      const updates: any = { isApproved: !currentStatus };
      if (!currentStatus && gerobakId) {
        updates.gerobakId = gerobakId;
        // Auto-generate QR code data on approval
        updates.qrCode = `MIENIAN-KANGDOMIE-${gerobakId}-${uid.slice(0, 8)}`;
      }
      await updateDoc(doc(db, "kangdomie_drivers", uid), updates);
      setDrivers((prev) =>
        prev.map((d) => (d.uid === uid ? {
          ...d,
          isApproved: !currentStatus,
          gerobakId: gerobakId || d.gerobakId,
          qrCode: updates.qrCode || d.qrCode,
        } : d))
      );
    } catch (err) {
      console.error("Error updating driver:", err);
    }
    setProcessing(null);
  };

  const deleteDriver = async (uid: string) => {
    if (!confirm("Yakin mau hapus driver ini?")) return;
    setProcessing(uid);
    try {
      await deleteDoc(doc(db, "kangdomie_drivers", uid));
      setDrivers((prev) => prev.filter((d) => d.uid !== uid));
    } catch (err) {
      console.error("Error deleting driver:", err);
    }
    setProcessing(null);
  };

  const viewDriverProfile = async (driver: Driver) => {
    setSelectedDriver(driver);
    const now = new Date();
    const [att, comm] = await Promise.all([
      getMonthlyAttendance(driver.uid, now.getFullYear(), now.getMonth() + 1),
      getDriverCommissionForPeriod(driver.uid, ...Object.values(getDateRange("monthly")) as [Date, Date]),
    ]);
    setDriverAttendance(att);
    setDriverCommission(comm);
  };

  const generateQRForDriver = async (driver: Driver) => {
    const qrData = `MIENIAN-KANGDOMIE-${driver.gerobakId}-${driver.uid.slice(0, 8)}`;
    await updateDoc(doc(db, "kangdomie_drivers", driver.uid), { qrCode: qrData });
    setDrivers((prev) => prev.map((d) => d.uid === driver.uid ? { ...d, qrCode: qrData } : d));
    alert(`QR Code generated: ${qrData}`);
  };

  const approved = drivers.filter((d) => d.isApproved);
  const pending = drivers.filter((d) => !d.isApproved);

  const generateNextGerobakId = () => {
    const existingIds = drivers
      .map((d) => d.gerobakId)
      .filter((id) => id && id.startsWith("M-GO-"))
      .map((id) => parseInt(id.replace("M-GO-", ""), 10))
      .filter((n) => !isNaN(n));
    const maxNum = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return `M-GO-${String(maxNum + 1).padStart(3, "0")}`;
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "drivers", label: "Kelola Driver", count: drivers.length },
    { id: "profiles", label: "Profil & Statistik" },
    { id: "attendance", label: "Absensi" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-3">
            <Truck className="w-7 h-7 text-primary" />
            Manajemen KangDoMie
          </h1>
          <p className="text-sm text-foreground/50 mt-1">
            Kelola driver, profil, statistik, dan absensi.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-bold">
            {approved.length} Aktif
          </span>
          <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 font-bold">
            {pending.length} Pending
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-card-border p-1.5 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedDriver(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-foreground/50 hover:text-foreground hover:bg-white/5"
            }`}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* ======= TAB: DRIVERS ======= */}
          {activeTab === "drivers" && (
            <div className="space-y-6">
              {pending.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    Menunggu Approval ({pending.length})
                  </h2>
                  <div className="space-y-3">
                    {pending.map((driver) => (
                      <DriverCard
                        key={driver.uid}
                        driver={driver}
                        processing={processing === driver.uid}
                        suggestedGerobakId={generateNextGerobakId()}
                        onToggleApproval={(gerobakId) => toggleApproval(driver.uid, driver.isApproved, gerobakId)}
                        onDelete={() => deleteDriver(driver.uid)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {approved.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Driver Aktif ({approved.length})
                  </h2>
                  <div className="space-y-3">
                    {approved.map((driver) => (
                      <DriverCard
                        key={driver.uid}
                        driver={driver}
                        processing={processing === driver.uid}
                        onToggleApproval={() => toggleApproval(driver.uid, driver.isApproved)}
                        onDelete={() => deleteDriver(driver.uid)}
                        onViewProfile={() => { viewDriverProfile(driver); setActiveTab("profiles"); }}
                        onGenerateQR={() => generateQRForDriver(driver)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {drivers.length === 0 && (
                <div className="text-center py-16">
                  <Truck className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                  <p className="text-foreground/40 text-lg font-bold">Belum ada driver terdaftar</p>
                  <p className="text-foreground/30 text-sm mt-1">Driver bisa daftar lewat /kangdomie/login</p>
                </div>
              )}
            </div>
          )}

          {/* ======= TAB: PROFILES ======= */}
          {activeTab === "profiles" && (
            <div className="space-y-4">
              {!selectedDriver ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approved.map((driver) => (
                    <button
                      key={driver.uid}
                      onClick={() => viewDriverProfile(driver)}
                      className="card p-5 text-left hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5">
                          {driver.photoURL ? (
                            <Image src={driver.photoURL} alt={driver.name} width={48} height={48} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-foreground/20">
                              {driver.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold">{driver.name}</p>
                          <p className="text-xs text-foreground/40 font-mono">{driver.gerobakId}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-green-400 font-bold">{formatRupiah(driver.totalSales || 0)}</span>
                        <span className="text-foreground/30">|</span>
                        <span className="text-yellow-400 font-bold">{formatRupiah(driver.totalCommission || 0)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => setSelectedDriver(null)} className="text-sm text-primary font-bold hover:underline">
                    ← Kembali ke semua profil
                  </button>

                  {/* Driver Profile Detail */}
                  <div className="card p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5">
                        {selectedDriver.photoURL ? (
                          <Image src={selectedDriver.photoURL} alt={selectedDriver.name} width={64} height={64} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-foreground/20">
                            {selectedDriver.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold">{selectedDriver.name}</h2>
                        <p className="text-sm text-foreground/40 font-mono">{selectedDriver.gerobakId}</p>
                        <p className="text-xs text-foreground/30 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {selectedDriver.phone}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4 text-center">
                        <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
                        <p className="text-lg font-extrabold text-green-400">{formatRupiah(selectedDriver.totalSales || 0)}</p>
                        <p className="text-[10px] text-foreground/40 mt-1">Total Penjualan</p>
                      </div>
                      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 text-center">
                        <DollarSign className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                        <p className="text-lg font-extrabold text-yellow-400">{formatRupiah(selectedDriver.totalCommission || 0)}</p>
                        <p className="text-[10px] text-foreground/40 mt-1">Total Komisi</p>
                      </div>
                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 text-center">
                        <Briefcase className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <p className="text-lg font-extrabold text-blue-400">{selectedDriver.workDays || 0}</p>
                        <p className="text-[10px] text-foreground/40 mt-1">Hari Kerja</p>
                      </div>
                      <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4 text-center">
                        <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                        <p className="text-lg font-extrabold text-purple-400">{driverCommission.count}</p>
                        <p className="text-[10px] text-foreground/40 mt-1">Transaksi Bulan Ini</p>
                      </div>
                    </div>

                    {/* Monthly commission */}
                    <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-xs font-bold text-foreground/40 uppercase mb-2">Bulan Ini</p>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-sm text-foreground/50">Penjualan</p>
                          <p className="font-bold text-green-400">{formatRupiah(driverCommission.totalSales)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-foreground/50">Komisi</p>
                          <p className="font-bold text-yellow-400">{formatRupiah(driverCommission.totalCommission)}</p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    {selectedDriver.qrCode && (
                      <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-xs font-bold text-foreground/40 uppercase mb-2 flex items-center gap-1"><QrCode className="w-3 h-3" /> eCard QR Data</p>
                        <p className="text-sm font-mono bg-white/5 px-3 py-2 rounded-lg">{selectedDriver.qrCode}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======= TAB: ATTENDANCE ======= */}
          {activeTab === "attendance" && (
            <div className="space-y-4">
              {!selectedDriver ? (
                <div className="space-y-3">
                  <p className="text-sm text-foreground/50">Pilih driver untuk lihat absensi:</p>
                  {approved.map((driver) => (
                    <button
                      key={driver.uid}
                      onClick={() => viewDriverProfile(driver)}
                      className="w-full card p-4 flex items-center justify-between hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5">
                          {driver.photoURL ? (
                            <Image src={driver.photoURL} alt={driver.name} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-foreground/20">
                              {driver.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">{driver.name}</p>
                          <p className="text-xs text-foreground/40">{driver.gerobakId} • {driver.workDays || 0} hari kerja</p>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-foreground/30" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => setSelectedDriver(null)} className="text-sm text-primary font-bold hover:underline">
                    ← Kembali
                  </button>

                  <div className="card p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-bold">Absensi — {selectedDriver.name}</p>
                        <p className="text-xs text-foreground/40">Bulan {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
                      </div>
                    </div>

                    {driverAttendance.length === 0 ? (
                      <p className="text-center text-foreground/30 py-8 text-sm">Belum ada data absensi bulan ini</p>
                    ) : (
                      <div className="space-y-2">
                        {driverAttendance.map((att) => {
                          const checkInTime = att.checkInTime?.toDate?.()?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) || "-";
                          const checkOutTime = att.checkOutTime?.toDate?.()?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                          return (
                            <div key={att.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${att.status === "checked_in" ? "bg-green-400" : "bg-zinc-400"}`} />
                                <div>
                                  <p className="text-sm font-bold">{new Date(att.date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}</p>
                                  <p className="text-[10px] text-foreground/40">
                                    Check-in: {checkInTime} {checkOutTime ? `• Check-out: ${checkOutTime}` : ""}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                att.status === "checked_in" ? "bg-green-500/20 text-green-400" : "bg-zinc-500/20 text-zinc-400"
                              }`}>
                                {att.status === "checked_in" ? "Aktif" : "Selesai"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DriverCard({
  driver,
  processing,
  suggestedGerobakId,
  onToggleApproval,
  onDelete,
  onViewProfile,
  onGenerateQR,
}: {
  driver: Driver;
  processing: boolean;
  suggestedGerobakId?: string;
  onToggleApproval: (gerobakId?: string) => void;
  onDelete: () => void;
  onViewProfile?: () => void;
  onGenerateQR?: () => void;
}) {
  const [editGerobakId, setEditGerobakId] = useState(driver.gerobakId || suggestedGerobakId || "");

  return (
    <div className={`card p-5 space-y-4 ${!driver.isApproved ? "border-yellow-500/20" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            driver.isOnline ? "bg-green-500/20 text-green-400" : "bg-white/5 text-foreground/30"
          }`}>
            {driver.photoURL ? (
              <Image src={driver.photoURL} alt={driver.name} width={48} height={48} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Truck className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold">{driver.name}</p>
              {driver.isOnline && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">ONLINE</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-foreground/50 mt-1">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {driver.phone}</span>
              {driver.gerobakId && (
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {driver.gerobakId}</span>
              )}
            </div>
            {driver.isApproved && (
              <div className="flex gap-3 text-[10px] mt-1">
                <span className="text-green-400">Sales: {formatRupiah(driver.totalSales || 0)}</span>
                <span className="text-yellow-400">Komisi: {formatRupiah(driver.totalCommission || 0)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onViewProfile && (
            <button onClick={onViewProfile} className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Lihat Profil">
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onGenerateQR && !driver.qrCode && (
            <button onClick={onGenerateQR} className="p-2 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors" title="Generate QR">
              <QrCode className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onToggleApproval(editGerobakId || undefined)}
            disabled={processing}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
              driver.isApproved
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
            } disabled:opacity-50`}
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : driver.isApproved ? (
              <><XCircle className="w-4 h-4" /> Revoke</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Approve</>
            )}
          </button>
          <button
            onClick={onDelete}
            disabled={processing}
            className="p-2 rounded-xl bg-red-500/5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!driver.isApproved && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
          <Hash className="w-4 h-4 text-yellow-400 shrink-0" />
          <input
            type="text"
            value={editGerobakId}
            onChange={(e) => setEditGerobakId(e.target.value)}
            placeholder="Assign ID Gerobak, misal: M-GO-001"
            className="flex-1 px-3 py-2 rounded-lg bg-card border border-card-border text-sm focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {driver.qrCode && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
          <QrCode className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-xs text-foreground/50 font-mono truncate">{driver.qrCode}</span>
        </div>
      )}
    </div>
  );
}
