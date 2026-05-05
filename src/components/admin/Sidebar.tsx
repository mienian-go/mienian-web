"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Utensils,
  PackageSearch,
  ShoppingCart,
  Calendar,
  Settings,
  MenuSquare,
  MessageSquareQuote,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  UserCheck,
  LogOut,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Affiliates", href: "/admin/affiliates", icon: UserCheck },
  { name: "Catering Packages", href: "/admin/packages", icon: PackageSearch },
  { name: "Menu Satuan", href: "/admin/menu", icon: Utensils },
  { name: "Blog", href: "/admin/blog", icon: FileText },
  { name: "Jadwal GO", href: "/admin/schedule", icon: Calendar },
  { name: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
  { name: "Content", href: "/admin/content", icon: MenuSquare },
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "Admins", href: "/admin/admins", icon: ShieldAlert },
];

export default function Sidebar() {
  const { logout, role } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  // Filter menu based on role
  const filteredNavItems = navItems.filter(item => {
    if (role === "superadmin") return true;
    if (role === "content_writer") return ["Blog", "Dashboard"].includes(item.name);
    if (role === "staff") return !["Admins", "Settings"].includes(item.name);
    return false; // Fallback
  });

  return (
    <>
      <motion.aside
        initial={{ width: 256 }}
        animate={{ width: isOpen ? 256 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full bg-card border-r border-white/5 flex flex-col shrink-0 z-20 overflow-hidden relative"
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="open"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
              >
                <span className="text-xl font-extrabold tracking-tight text-white">Mienian</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">ADMIN</span>
              </motion.div>
            ) : (
              <motion.div
                key="closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center font-bold"
              >
                M
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all group ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                }`}
                title={!isOpen ? item.name : undefined}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : "text-foreground/50 group-hover:text-foreground"}`} />
                
                <AnimatePresence mode="wait">
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden text-sm"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => logout()}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg font-medium text-red-500 hover:bg-red-500/10 transition-all group`}
            title={!isOpen ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden text-sm"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-foreground/50 hover:bg-white/5 hover:text-foreground transition-colors"
          >
            {isOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
