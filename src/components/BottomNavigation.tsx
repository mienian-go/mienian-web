"use client";

import { Home, Bike, Store, User, QrCode } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface BottomNavigationProps {
  activeTab: "home" | "go" | "qr" | "stall" | "akun";
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const router = useRouter();

  const handleTabClick = (tab: string, path: string) => {
    if (activeTab === tab) return;
    router.push(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="max-w-md mx-auto flex items-end justify-between px-2 pt-2 pb-3 relative">
        
        <button onClick={() => handleTabClick("home", "/")} className="flex-1 flex flex-col items-center gap-1">
          <Home className={`w-6 h-6 ${activeTab === "home" ? "text-[#C8102E] fill-current" : "text-gray-400"}`} />
          <span className={`text-[9px] font-bold ${activeTab === "home" ? "text-[#C8102E]" : "text-gray-400"}`}>Home</span>
        </button>
        
        <button onClick={() => handleTabClick("go", "/mienian-go")} className="flex-1 flex flex-col items-center gap-1">
          <Bike className={`w-6 h-6 ${activeTab === "go" ? "text-[#C8102E]" : "text-gray-400"}`} />
          <span className={`text-[9px] font-bold ${activeTab === "go" ? "text-[#C8102E]" : "text-gray-400"}`}>GO</span>
        </button>

        {/* CENTER RED BUTTON */}
        <div className="flex-1 flex justify-center -translate-y-4">
           <button onClick={() => handleTabClick("qr", "/qr")} className="w-14 h-14 bg-[#C8102E] rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-red-500/30 transform rotate-45 hover:scale-105 active:scale-95 transition-all">
              <div className="transform -rotate-45 text-white">
                <QrCode className="w-6 h-6" />
              </div>
           </button>
        </div>

        <button onClick={() => handleTabClick("stall", "/stall")} className="flex-1 flex flex-col items-center gap-1">
          <Store className={`w-6 h-6 ${activeTab === "stall" ? "text-[#C8102E]" : "text-gray-400"}`} />
          <span className={`text-[9px] font-bold ${activeTab === "stall" ? "text-[#C8102E]" : "text-gray-400"}`}>Stall</span>
        </button>

        <button onClick={() => handleTabClick("akun", "/akun")} className="flex-1 flex flex-col items-center gap-1">
          <User className={`w-6 h-6 ${activeTab === "akun" ? "text-[#C8102E]" : "text-gray-400"}`} />
          <span className={`text-[9px] font-bold ${activeTab === "akun" ? "text-[#C8102E]" : "text-gray-400"}`}>Akun</span>
        </button>

      </div>
    </nav>
  );
}
