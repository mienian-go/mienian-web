"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, User, Mail, Phone, MapPin, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, updateUserProfile } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push("/akun");
      return;
    }
    
    async function fetchProfile() {
      try {
        const profile = await getUserProfile(user!.uid);
        if (profile) {
          setName(profile.name || "");
          setWhatsapp(profile.whatsapp || "");
          setAddress(profile.address || "");
        }
        setPhotoUrl(user?.photoURL || "");
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProfile();
  }, [user, router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung deteksi lokasi.");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, lng } = { latitude: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBgj6aPrkcd-B2lWsE0_AdA8PQpbO13R7c";
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${lng}&key=${apiKey}&language=id`);
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setAddress(data.results[0].formatted_address);
          } else {
             setError("Gagal menemukan alamat dari lokasi Anda.");
          }
        } catch (err) {
          setError("Gagal mendeteksi lokasi.");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setError("Izin lokasi ditolak.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    
    try {
      let finalPhotoUrl = user?.photoURL;

      // Upload new photo if changed
      if (photoFile) {
        const fileRef = ref(storage, `profiles/${user!.uid}`);
        await uploadBytes(fileRef, photoFile);
        finalPhotoUrl = await getDownloadURL(fileRef);
        
        // Update auth profile
        await updateProfile(user!, { photoURL: finalPhotoUrl });
      }

      // Update firestore profile
      await updateUserProfile(user!.uid, {
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        address: address.trim(),
      });
      router.push("/akun");
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan profil.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C8102E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="font-bold text-lg text-gray-900">Ubah Profil</h1>
      </div>

      <div className="flex-1 px-5 pt-6 pb-28">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6 flex flex-col items-center">
          <input 
             type="file" 
             accept="image/*" 
             className="hidden" 
             ref={fileInputRef} 
             onChange={handlePhotoChange} 
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 relative border-4 border-white shadow-md overflow-hidden cursor-pointer group"
          >
             {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="object-cover w-full h-full" />
             ) : (
                <User className="w-10 h-10 text-gray-400" />
             )}
             <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <ImageIcon className="w-6 h-6 text-white" />
             </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium text-center px-4">
            Ketuk foto untuk mengubah avatar profil Anda
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-700 ml-1">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama Anda"
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#C8102E] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-700 ml-1">Nomor WhatsApp (Terkunci)</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={whatsapp}
                disabled
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-100 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-gray-400 ml-1">Nomor WhatsApp utama Anda tidak dapat diubah.</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
               <label className="text-xs font-black text-gray-700">Alamat Pengiriman</label>
               <button 
                 type="button" 
                 onClick={detectLocation}
                 disabled={isDetectingLocation}
                 className="text-[10px] font-bold text-[#C8102E] flex items-center gap-1 disabled:opacity-50"
               >
                 {isDetectingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                 Deteksi Otomatis
               </button>
            </div>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Masukkan alamat pengiriman lengkap Anda"
                rows={3}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#C8102E] transition-all resize-none"
              />
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2.5 rounded-xl font-medium">
              {error}
            </motion.div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-[#C8102E] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-red-500/20 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
