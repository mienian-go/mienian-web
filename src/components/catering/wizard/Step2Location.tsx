"use client";

import { useBooking, CityCode } from "@/context/BookingContext";
import { MapPin, Clock, CalendarDays, Rocket } from "lucide-react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { useState, useRef, useEffect } from "react";

const libraries: "places"[] = ["places"];

// Origin Addresses hardcoded from script
const KOTA_ORIGIN: Record<string, string> = {
  Jakarta: "Jl. Kelapa Gading No.2, Gandaria Selatan, Cilandak",
  Bandung: "Ujung Berung Indah, Bandung",
  Yogyakarta: "Jl. Subali No.2, Sariharjo, Sleman, Yogyakarta"
};

export function Step2Location() {
  const { state, dispatch } = useBooking();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC-JcHUBPoB4BLCkVus1PyXd7IPkWEEyHI",
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculateDistance = (dest: string, origin: string) => {
    if (!window.google) return;
    setCalculating(true);

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [dest],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        setCalculating(false);
        if (status === "OK" && response && response.rows[0].elements[0].status === "OK") {
          const distanceKm = response.rows[0].elements[0].distance.value / 1000;
          dispatch({ type: "SET_FIELD", payload: { field: "distanceKm", value: distanceKm } });
        } else {
          dispatch({ type: "SET_FIELD", payload: { field: "distanceKm", value: 0 } });
          alert("Alamat terlalu jauh atau tidak bisa dijangkau rute mobil.");
        }
      }
    );
  };

  const onLoad = (autocompleteInst: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInst);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        dispatch({ type: "SET_FIELD", payload: { field: "address", value: place.formatted_address } });
        // Calculate right away if city is already chosen
        if (state.city && KOTA_ORIGIN[state.city]) {
          calculateDistance(place.formatted_address, KOTA_ORIGIN[state.city]);
        }
      }
    }
  };

  // Safe re-trigger if city changes but address is already filled
  useEffect(() => {
    if (state.city && state.address && window.google) {
      calculateDistance(state.address, KOTA_ORIGIN[state.city]);
    }
  }, [state.city]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold mb-1">Cek Ketersediaan Logistik 🚚</h2>
        <p className="text-foreground/60 text-sm">Kasih tau Mienian kapan dan di mana acaranya.</p>
      </div>

      <div className="space-y-5">
        {/* Kota Asal */}
        <div>
          <label className="block text-sm font-semibold mb-2">Pilih Dapur Terdekat (Kota) <span className="text-primary">*</span></label>
          <div className="flex gap-3">
            {["Jakarta", "Bandung", "Yogyakarta"].map((kota) => (
              <button
                key={kota}
                onClick={() => dispatch({ type: "SET_FIELD", payload: { field: "city", value: kota as CityCode } })}
                className={`flex-1 py-3 text-sm rounded-xl font-bold border-2 transition-all ${
                  state.city === kota ? "bg-primary/10 border-primary text-primary" : "bg-card border-card-border hover:border-primary/50 text-foreground/70"
                }`}
              >
                {kota}
              </button>
            ))}
          </div>
        </div>

        {/* Alamat API */}
        <div>
          <label className="block text-sm font-semibold mb-2">Alamat Lengkap Venue <span className="text-primary">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="w-5 h-5 text-foreground/40" />
            </div>
            
            {isLoaded ? (
              <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                 <input
                  type="text"
                  value={state.address}
                  onChange={(e) => dispatch({ type: "SET_FIELD", payload: { field: "address", value: e.target.value } })}
                  placeholder="Ketik lalu pilih alamat dari dropdown Google Maps"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </Autocomplete>
            ) : (
                <input
                  type="text"
                  placeholder="Loading Maps..."
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-transparent opacity-50 cursor-not-allowed"
                />
            )}
           
          </div>
          {calculating && <p className="text-xs text-primary mt-2 animate-pulse flex items-center gap-1"><Rocket className="w-3 h-3"/> Menghitung jarak rute mobil...</p>}
        </div>

        {/* Tanggal & Waktu */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
             <label className="block text-sm font-semibold mb-2">Tanggal Acara <span className="text-primary">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDays className="w-5 h-5 text-foreground/40" />
                </div>
                <input
                  type="date"
                  value={state.date}
                  onChange={(e) => dispatch({ type: "SET_FIELD", payload: { field: "date", value: e.target.value } })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
          </div>
          <div className="flex-1">
             <label className="block text-sm font-semibold mb-2">Jam Serving (Mulai) <span className="text-primary">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="w-5 h-5 text-foreground/40" />
                </div>
                <input
                  type="time"
                  value={state.time}
                  onChange={(e) => dispatch({ type: "SET_FIELD", payload: { field: "time", value: e.target.value } })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
          </div>
        </div>

      </div>
    </div>
  );
}
