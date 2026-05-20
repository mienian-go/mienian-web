"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { GoogleMap, useLoadScript, MarkerF, CircleF, InfoWindowF } from "@react-google-maps/api";
import { motion } from "framer-motion";
import { Loader2, Bike, Store, ArrowRight, Clock, MapPin } from "lucide-react";
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

interface NearbyKangDoMieMapProps {
  onStartOrder?: () => void;
  hideTitle?: boolean;
}

export default function NearbyKangDoMieMap({ onStartOrder, hideTitle }: NearbyKangDoMieMapProps) {
  const router = useRouter();
  const { state, dispatch } = useGoCart();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<KangDoMieLocation | null>(null);
  const [selectedDriverProfile, setSelectedDriverProfile] = useState<any | null>(null);
  const [nearbyKang, setNearbyKang] = useState<KangDoMieLocation[]>([]);
  const [rawLocations, setRawLocations] = useState<KangDoMieLocation[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const userLocRef = useRef<{ lat: number; lng: number } | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBgj6aPrkcd-B2lWsE0_AdA8PQpbO13R7c",
    libraries,
  });

  // Geolocation trigger
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          userLocRef.current = loc;
        },
        () => {
          const fallback = { lat: -6.2615, lng: 106.8106 }; // Jakarta fallback
          setUserLocation(fallback);
          userLocRef.current = fallback;
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Locations subscription
  useEffect(() => {
    const unsubscribe = subscribeToKangDoMieLocations((locations) => {
      setRawLocations(locations);
    });
    return () => unsubscribe();
  }, []);

  // Filter nearby available drivers within 1km
  useEffect(() => {
    const filterLocations = () => {
      const now = Date.now();
      const activeLocations = rawLocations.filter((k) => {
        if (!k.lastUpdated) return false;
        try {
          const diff = now - k.lastUpdated.toMillis();
          return diff <= 45000; // 45 seconds buffer
        } catch { return false; }
      });

      const loc = userLocRef.current;
      if (loc) {
        const filtered = activeLocations.filter(
          (k) => getDistanceKm(loc.lat, loc.lng, k.lat, k.lng) <= 1.0 // 1km detection radius
        );
        setNearbyKang(filtered);
      } else {
        setNearbyKang(activeLocations);
      }
    };

    filterLocations();
    const interval = setInterval(filterLocations, 5000);
    return () => clearInterval(interval);
  }, [rawLocations]);

  // Fetch selected driver profile details
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
      } catch (e) {
        console.error("Error fetching driver profile:", e);
      }
    };
    fetchProfile();
  }, [selectedMarker]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Nearest driver logic (defaults to closest active driver)
  const availableDrivers = nearbyKang.filter((k) => k.status === "available");
  const nearestDriver = selectedMarker || availableDrivers[0] || null;
  const isCooking = selectedDriverProfile?.isCooking || false;

  const handleOrderTypeToggle = (mode: "delivery" | "pickup") => {
    if (!nearestDriver) return;
    dispatch({
      type: "SET_DELIVERY_DETAILS",
      payload: { 
        orderMode: mode, 
        driverId: nearestDriver.id, 
        driverName: nearestDriver.name 
      },
    });
    setTimeout(() => { document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  const handlePesanSekarang = () => {
    if (!nearestDriver) return;
    dispatch({
      type: "SET_DELIVERY_DETAILS",
      payload: { driverId: nearestDriver.id, driverName: nearestDriver.name },
    });
    if (onStartOrder) {
      onStartOrder();
    }
  };

  return (
    <div className="relative w-full h-[65vh] rounded-3xl overflow-hidden shadow-lg border border-card-border">
      {/* MAP VIEWER */}
      {!isLoaded || !userLocation ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/60 backdrop-blur-xs z-10">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-foreground/50 font-bold">Mencari gerobak Mienian terdekat...</p>
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
            zoomControl: false,
          }}
        >
          {/* User Location Marker */}
          <MarkerF
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
            title="Lokasi Anda"
          />

          {/* 10KM Safe Circle */}
          <CircleF
            center={userLocation}
            radius={1000}
            options={{
              fillColor: "#E53935",
              fillOpacity: 0.04,
              strokeColor: "#E53935",
              strokeOpacity: 0.15,
              strokeWeight: 1.5,
            }}
          />

          {/* KangDoMie Live Markers */}
          {nearbyKang.map((kang) => {
            const isDriverSelected = nearestDriver?.id === kang.id;
            return (
              <MarkerF
                key={kang.id}
                position={{ lat: kang.lat, lng: kang.lng }}
                onClick={() => setSelectedMarker(kang)}
                icon={{
                  url: "/images/kangdomie_marker_user.png",
                  scaledSize: isDriverSelected ? new google.maps.Size(48, 48) : new google.maps.Size(36, 36),
                  origin: new google.maps.Point(0, 0),
                  anchor: isDriverSelected ? new google.maps.Point(24, 24) : new google.maps.Point(18, 18),
                }}
              />
            );
          })}
        </GoogleMap>
      )}

      {/* FLOAT BOTTOM CARD (Pixel-Perfect from WhatsApp Mockup) */}
      <div className="absolute bottom-3 left-3 right-3 z-25 bg-white rounded-3xl p-4 shadow-xl border border-gray-100 text-black">
        {/* Drag handle decoration */}
        <div className="w-10 h-1 bg-foreground/15 rounded-full mx-auto mb-3 shrink-0" />

        {nearestDriver ? (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base leading-tight tracking-tight">
                  {nearestDriver.driverName || nearestDriver.name || "KangDoMie terdekat"}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-red-500 font-extrabold text-xs">
                  <Clock className="w-3.5 h-3.5 fill-red-500/10" />
                  <span>{nearestDriver.eta || "3 menit"}</span>
                </div>
              </div>

              {/* Badge */}
              <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-red-500/15">
                🔥 KANGDOMIE
              </span>
            </div>

            {/* Delivery / Pickup Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOrderTypeToggle("delivery")}
                className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 border text-xs font-black transition-all ${
                  state.orderMode === "delivery"
                    ? "bg-red-500/10 border-red-500/30 text-red-500 shadow-xs"
                    : "bg-muted/50 border-card-border text-foreground/50 hover:bg-muted"
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Delivery</span>
              </button>

              <button
                onClick={() => handleOrderTypeToggle("pickup")}
                className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 border text-xs font-black transition-all ${
                  state.orderMode === "pickup"
                    ? "bg-red-500/10 border-red-500/30 text-red-500 shadow-xs"
                    : "bg-muted/50 border-card-border text-foreground/50 hover:bg-muted"
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Pickup</span>
              </button>
            </div>

            {/* Large red CTA button */}
            <button
              onClick={handlePesanSekarang}
              className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-98"
            >
              <span>SAMPERIN KANGDOMIE INI →</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="font-black text-sm text-gray-800">Tidak ada KangDoMie Aktif</h4>
            <p className="text-[10px] text-gray-500 leading-relaxed px-6">
              Gerobak Mienian sedang offline atau berada di luar jangkauan. Silakan cek kembali nanti ya!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
