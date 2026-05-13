"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, ScanLine, BarChart3, UserCircle } from "lucide-react";
import Image from "next/image";

const tabs = [
  { name: "Home", href: "/kangdomie/dashboard", icon: Home },
  { name: "POS", href: "/kangdomie/pos", icon: ShoppingCart },
  { name: "Scan", href: "/kangdomie/scan", icon: ScanLine },
  { name: "Report", href: "/kangdomie/report", icon: BarChart3 },
  { name: "Profil", href: "/kangdomie/profile", icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f1a]/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
      <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "text-primary"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {tab.name === "Scan" ? (
                <div className={`w-12 h-12 -mt-6 rounded-full flex items-center justify-center shadow-lg ${
                  isActive ? "bg-primary" : "bg-white/10"
                }`}>
                  <Icon className={`w-6 h-6 ${isActive ? "text-white" : "text-white/60"}`} />
                </div>
              ) : (
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              )}
              <span className={`text-[10px] font-bold ${isActive ? "text-primary" : ""}`}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
