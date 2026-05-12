"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, CheckCircle2, XCircle, Truck, MapPin, Phone, User, Trash2, Shield } from "lucide-react";

interface Driver {
  uid: string;
  name: string;
  phone: string;
  gerobakId: string;
  isOnline: boolean;
  isApproved: boolean;
  createdAt: any;
}

export default function AdminKangDoMiePage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

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

  const toggleApproval = async (uid: string, currentStatus: boolean) => {
    setProcessing(uid);
    try {
      await updateDoc(doc(db, "kangdomie_drivers", uid), { isApproved: !currentStatus });
      setDrivers((prev) =>
        prev.map((d) => (d.uid === uid ? { ...d, isApproved: !currentStatus } : d))
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

  const approved = drivers.filter((d) => d.isApproved);
  const pending = drivers.filter((d) => !d.isApproved);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-3">
            <Truck className="w-7 h-7 text-primary" />
            Manajemen KangDoMie
          </h1>
          <p className="text-sm text-foreground/50 mt-1">
            Kelola driver gerobak Mienian GO. Approve/reject pendaftaran baru.
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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-16">
          <Truck className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/40 text-lg font-bold">Belum ada driver terdaftar</p>
          <p className="text-foreground/30 text-sm mt-1">Driver bisa daftar lewat /kangdomie/login</p>
        </div>
      ) : (
        <>
          {/* Pending Approval */}
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
                    onToggleApproval={() => toggleApproval(driver.uid, driver.isApproved)}
                    onDelete={() => deleteDriver(driver.uid)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Approved Drivers */}
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
                  />
                ))}
              </div>
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
  onToggleApproval,
  onDelete,
}: {
  driver: Driver;
  processing: boolean;
  onToggleApproval: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
      !driver.isApproved ? "border-yellow-500/20" : ""
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          driver.isOnline ? "bg-green-500/20 text-green-400" : "bg-white/5 text-foreground/30"
        }`}>
          <Truck className="w-6 h-6" />
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
            <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {driver.gerobakId}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleApproval}
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
  );
}
