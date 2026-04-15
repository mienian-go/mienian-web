"use client";

import { useBooking, EventType } from "@/context/BookingContext";
import { User, Phone, CalendarHeart } from "lucide-react";

export function Step1Profile() {
  const { state, dispatch } = useBooking();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold mb-1">Mulai Kenalan Dulu 👋</h2>
        <p className="text-foreground/60 text-sm">Biar kru Mienian gampang ngehubungin pas hari H.</p>
      </div>

      <div className="space-y-4">
        {/* Nama Pemesan */}
        <div>
          <label className="block text-sm font-semibold mb-2">Nama Pemesan <span className="text-primary">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-foreground/40" />
            </div>
            <input
              type="text"
              value={state.name}
              onChange={(e) => dispatch({ type: "SET_FIELD", payload: { field: "name", value: e.target.value } })}
              placeholder="Misal: Dimas / PT Makmur Sejahtera"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-semibold mb-2">Nomor WhatsApp <span className="text-primary">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="w-5 h-5 text-foreground/40" />
            </div>
            <input
              type="tel"
              value={state.whatsapp}
              onChange={(e) => dispatch({ type: "SET_FIELD", payload: { field: "whatsapp", value: e.target.value } })}
              placeholder="Contoh: 081234567890"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        {/* Jenis Acara */}
        <div>
          <label className="block text-sm font-semibold mb-2">Pilihan Acara <span className="text-primary">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarHeart className="w-5 h-5 text-foreground/40" />
            </div>
            <select
              value={state.eventType}
              onChange={(e) => dispatch({ type: "SET_FIELD", payload: { field: "eventType", value: e.target.value as EventType } })}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors appearance-none"
              required
            >
              <option value="" disabled>-- Pilih Acara --</option>
              <option value="Wedding">Wedding</option>
              <option value="Gathering">Gathering Kantor / Keluarga</option>
              <option value="Khitan">Khitanan</option>
              <option value="Pengajian">Pengajian / Syukuran</option>
            </select>
          </div>
          
          {state.eventType === "Wedding" && (
            <p className="mt-2 text-xs text-primary font-medium animate-in fade-in slide-in-from-top-1 px-1">
              *Catatan: Sesuai SOP Mienian, Paket Reguler (A la carte) dimatikan khusus acara Wedding demi menjaga kecepatan pelayanan tamu undangan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
