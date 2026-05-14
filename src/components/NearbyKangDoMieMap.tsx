"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, useLoadScript, MarkerF, CircleF, InfoWindowF } from "@react-google-maps/api";
import { motion } from "framer-motion";
import { MapPin, Navigation, Loader2, AlertCircle, Bike } from "lucide-react";
import { subscribeToKangDoMieLocations, type KangDoMieLocation } from "@/lib/firestoreGo";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useGoCart } from "@/context/GoCartContext";

const libraries: "places"[] = ["places"];

const mapContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  position: "absolute",
  top: 0,
  left: 0,
  borderRadius: "16px",
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#252525" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a3a1a" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
];

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export default function NearbyKangDoMieMap() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<KangDoMieLocation | null>(null);
  const [selectedDriverProfile, setSelectedDriverProfile] = useState<any | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [nearbyKang, setNearbyKang] = useState<KangDoMieLocation[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const userLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const { dispatch } = useGoCart();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBgj6aPrkcd-B2lWsE0_AdA8PQpbO13R7c",
    libraries,
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          userLocRef.current = loc;
        },
        () => {
          const fallback = { lat: -6.2615, lng: 106.8106 };
          setUserLocation(fallback);
          userLocRef.current = fallback;
          setLocationError("Izin lokasi ditolak. Menampilkan area Jakarta.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Subscribe to Firestore KangDoMie locations (real-time)
  useEffect(() => {
    const unsubscribe = subscribeToKangDoMieLocations((locations) => {
      // Filter by 1km radius if user location available
      const loc = userLocRef.current;
      if (loc) {
        const filtered = locations.filter(
          (k) => getDistanceKm(loc.lat, loc.lng, k.lat, k.lng) <= 1.0
        );
        setNearbyKang(filtered);
      } else {
        setNearbyKang(locations);
      }
    });
    return () => unsubscribe();
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fetch menu items once
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snap = await getDocs(query(collection(db, "menu_items"), orderBy("sortOrder", "asc")));
        setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {}
    };
    fetchMenu();
  }, []);

  // Fetch driver profile when selected
  useEffect(() => {
    if (!selectedMarker) {
      setSelectedDriverProfile(null);
      return;
    }
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "kangdomie_drivers", selectedMarker.id));
        if (snap.exists()) {
          setSelectedDriverProfile(snap.data());
        }
      } catch(e) {}
    };
    fetchProfile();
  }, [selectedMarker]);

  const availableCount = nearbyKang.filter((k) => k.status === "available").length;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium mb-4 text-primary">
            <Navigation className="w-4 h-4" />
            <span>Live Tracking</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
            KangDoMie <span className="gradient-text">Terdekat</span>
          </h2>
          <p className="text-foreground/60 text-lg max-w-xl mx-auto">
            Lihat posisi gerobak Mienian di sekitarmu dalam radius 1 km. Pesan langsung, antar cepat!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row gap-6"
        >
          {/* Map */}
          <div className="flex-1 card overflow-hidden p-0 min-h-[400px] h-[400px] lg:min-h-[500px] lg:h-[500px] relative">
            {!isLoaded || !userLocation ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/50">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-foreground/50 font-medium">Memuat peta & mencari lokasimu...</p>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={userLocation}
                zoom={15}
                onLoad={onMapLoad}
                options={{
                  styles: darkMapStyles,
                  disableDefaultUI: true,
                  zoomControl: true,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                }}
              >
                {/* User location */}
                <MarkerF
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3,
                  }}
                  title="Lokasi Kamu"
                />

                {/* 1km radius */}
                <CircleF
                  center={userLocation}
                  radius={1000}
                  options={{
                    fillColor: "#E53935",
                    fillOpacity: 0.06,
                    strokeColor: "#E53935",
                    strokeOpacity: 0.3,
                    strokeWeight: 2,
                  }}
                />

                {/* KangDoMie markers */}
                {nearbyKang.map((kang) => (
                  <MarkerF
                    key={kang.id}
                    position={{ lat: kang.lat, lng: kang.lng }}
                    onClick={() => setSelectedMarker(kang)}
                    icon={{
                      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                      fillColor: kang.status === "available" ? "#E53935" : "#9E9E9E",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 1.5,
                      scale: 1.8,
                      anchor: new google.maps.Point(12, 22),
                    }}
                  />
                ))}

                {/* Info Window */}
                {selectedMarker && (
                  <InfoWindowF
                    position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-1 min-w-[200px] text-gray-900">
                      <p className="font-bold text-sm mb-1">🛺 {selectedMarker.name}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${selectedMarker.status === "available" && !selectedDriverProfile?.isCooking ? "bg-green-500" : "bg-orange-500"}`} />
                        <span className="text-xs font-semibold">
                          {selectedMarker.status === "available" && !selectedDriverProfile?.isCooking ? "Tersedia" : "Sedang Melayani Pembeli"}
                        </span>
                      </div>

                      {selectedDriverProfile?.isCooking && selectedDriverProfile?.cookingUntil && (
                        <div className="bg-orange-50 rounded p-2 mb-2 border border-orange-200">
                          <p className="text-[10px] text-orange-800 font-medium">Driver sedang melayani pesanan di tempat. Jika Anda memanggil sekarang, driver akan jalan setelah selesai memasak.</p>
                          {(() => {
                            const end = selectedDriverProfile.cookingUntil.toMillis();
                            const diffMin = Math.max(0, Math.ceil((end - Date.now()) / 60000));
                            if (diffMin > 0) {
                              const travelMin = selectedMarker.eta ? parseInt(selectedMarker.eta) || 0 : 0;
                              const totalEta = diffMin + travelMin;
                              return (
                                <div className="mt-1 space-y-0.5">
                                  <p className="text-[10px] text-orange-600 font-semibold">Selesai masak: ~{diffMin} menit</p>
                                  {travelMin > 0 && (
                                    <p className="text-xs font-bold text-orange-700">Total Estimasi Tiba: ~{totalEta} menit</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}

                      {selectedMarker.status === "available" && !selectedDriverProfile?.isCooking && selectedMarker.eta && (
                        <p className="text-xs text-gray-500 mt-1 mb-2">⏱️ Estimasi Tiba: <strong>{selectedMarker.eta}</strong></p>
                      )}

                      {/* Stok Inventory */}
                      {selectedDriverProfile?.inventory && menuItems.length > 0 && (
                        <div className="mt-2 border-t border-gray-200 pt-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Stok Tersedia</p>
                          <div className="grid grid-cols-2 gap-1 max-h-[100px] overflow-y-auto pr-1">
                            {menuItems.map(item => {
                              const stock = selectedDriverProfile.inventory?.[item.id] ?? 0;
                              if (stock <= 0) return null;
                              return (
                                <div key={item.id} className="flex justify-between items-center bg-gray-50 px-1.5 py-1 rounded">
                                  <span className="text-[10px] truncate max-w-[60px]">{item.name}</span>
                                  <span className="text-[10px] font-bold">{stock}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          dispatch({ 
                            type: "SET_DELIVERY_DETAILS", 
                            payload: { driverId: selectedMarker.id, driverName: selectedMarker.name } 
                          });
                          document.getElementById("menu-go")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="w-full mt-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Pilih KangDoMie Ini
                      </button>
                    </div>
                  </InfoWindowF>
                )}
              </GoogleMap>
            )}
          </div>

          {/* Sidebar info */}
          <div className="w-full lg:w-[320px] shrink-0 space-y-4">
            {locationError && (
              <div className="card p-4 border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-200">{locationError}</p>
                </div>
              </div>
            )}

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bike className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-extrabold text-lg">{availableCount} KangDoMie</p>
                  <p className="text-xs text-foreground/50">tersedia di dekatmu</p>
                </div>
              </div>
              <div className="h-px bg-card-border mb-4" />
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {nearbyKang.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-2xl mb-2">😢</p>
                    <p className="text-sm font-bold text-foreground/60">Waduh, KangDoMie lagi muter jauh nih</p>
                    <p className="text-xs text-foreground/40 mt-1">Coba lagi nanti atau pesan delivery aja!</p>
                    <a href="#menu-go" className="inline-block mt-3 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                      Pesan Delivery →
                    </a>
                  </div>
                ) : (
                  nearbyKang.map((kang) => (
                    <button
                      key={kang.id}
                      onClick={() => {
                        setSelectedMarker(kang);
                        mapRef.current?.panTo({ lat: kang.lat, lng: kang.lng });
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all hover:border-primary/40 ${
                        selectedMarker?.id === kang.id ? "border-primary bg-primary/5" : "border-card-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🛺</span>
                          <div>
                            <p className="font-bold text-sm leading-tight">{kang.driverName || kang.name}</p>
                            <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-wider">
                              {kang.name.includes("—") ? kang.name.split(" — ")[0] : kang.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            kang.status === "available" 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-white/10 text-foreground/40"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${kang.status === "available" ? "bg-green-400" : "bg-foreground/30"}`} />
                            {kang.status === "available" ? "Ready" : "Busy"}
                          </span>
                          {kang.status === "available" && kang.eta && (
                            <p className="text-[10px] text-foreground/50 mt-1">⏱️ {kang.eta}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="card p-4 text-center">
              <div className="flex items-center justify-center gap-3 text-xs text-foreground/40">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-[#4285F4] border-2 border-white inline-block" /> Kamu
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" /> KangDoMie
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full border border-primary/30 inline-block" /> 1km
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
