"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");
  const isKangDoMiePage = pathname.startsWith("/kangdomie");
  const hideLayout = isAdminPage || isKangDoMiePage || pathname.startsWith("/mienian-go") || pathname.startsWith("/payment") || pathname.startsWith("/akun");
  return (
    <>
      {!hideLayout && <Navbar />}
      <main className="min-h-screen">{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
}
