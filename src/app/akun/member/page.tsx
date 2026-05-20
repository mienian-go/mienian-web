"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile } from "@/lib/firestore";
import { subscribeToUserPoints } from "@/lib/firestoreGo";

export default function MemberPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/akun");
      return;
    }

    async function fetchData() {
      try {
        const p = await getUserProfile(user!.uid);
        if (p) setProfile(p);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();

    const unsub = subscribeToUserPoints(user.uid, (data) => {
      setPoints(data?.points || 0);
    });

    return () => unsub();
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C8102E] animate-spin" />
      </div>
    );
  }

  const displayName = profile?.name || user?.displayName || user?.email?.split("@")[0] || "Mieniacs";

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center pb-12">
      {/* Header */}
      <div className="w-full bg-[#C8102E] px-4 pt-12 pb-24 relative overflow-hidden flex flex-col items-center rounded-b-[2.5rem]">
        <div className="absolute inset-0 opacity-10">
           <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0,100 L100,0 L100,100 Z" fill="white" />
           </svg>
        </div>
        
        <div className="w-full relative z-10 flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white absolute left-0"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <h1 className="font-black text-lg text-white w-full text-center tracking-wide">Mieniacs Member</h1>
        </div>

        <div className="relative z-10 text-center text-white space-y-1">
          <p className="text-sm font-semibold opacity-90">Hai,</p>
          <h2 className="text-2xl font-black">{displayName}</h2>
          <p className="text-xs opacity-75">{user?.email}</p>
        </div>
      </div>

      {/* QR Card */}
      <div className="w-full max-w-sm px-6 -mt-16 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 flex flex-col items-center border border-gray-100">
          
          <div className="mb-6 text-center">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Total Poin</h3>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-4xl font-black text-gray-900">{points.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border-4 border-[#F8F9FA] shadow-inner mb-6">
            <QRCode 
              value={user?.uid || "invalid"} 
              size={200}
              fgColor="#C8102E"
              level="H"
            />
          </div>
          
          <p className="text-xs text-gray-400 font-medium text-center leading-relaxed">
            Tunjukkan QR ini ke kasir atau scan saat di gerobak KangDoMie untuk mengumpulkan dan menukar poin!
          </p>
        </div>
      </div>
    </div>
  );
}
