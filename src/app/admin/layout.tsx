"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/admin/Sidebar";
import { LogOut, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicAdminPage = pathname === "/admin/login" || pathname === "/admin/setup" || pathname === "/admin/setup-first-admin";

  useEffect(() => {
    // If finished loading and there's no user, and they aren't on login/setup, kick to admin login
    if (!loading && !user && !isPublicAdminPage) {
      router.push("/admin/login");
    }
  }, [user, role, loading, router, pathname, isPublicAdminPage]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, render nothing while redirecting to admin login
  if (!user && !isPublicAdminPage) {
    return null;
  }

  // If on login or setup page, just render the children without sidebar
  if (isPublicAdminPage) {
    return <>{children}</>;
  }

  // User is logged in but has no admin role — show access denied within admin panel
  if (user && role === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="card max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <UserIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold">Akses Ditolak</h2>
          <p className="text-foreground/50 text-sm">
            Akun <strong className="text-foreground">{user.email}</strong> tidak memiliki hak akses admin. Hubungi Superadmin untuk mendapatkan akses.
          </p>
          <button onClick={logout} className="btn btn-primary w-full mt-4">
            <LogOut className="w-4 h-4" /> Logout & Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-black tracking-tighter text-primary">MIENIAN <span className="text-foreground/40 font-normal uppercase text-[10px] tracking-widest ml-1">Admin</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            <div className="h-8 w-px bg-white/5 mx-1" />

            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-[9px] font-bold text-foreground/40 uppercase leading-none mb-1">Logged in as</p>
                <p className="text-xs font-bold text-foreground/80 leading-none">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
