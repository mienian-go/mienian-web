"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDriver } from "@/lib/firestoreDriver";
import { Loader2 } from "lucide-react";

export default function KangDoMieIndex() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const driver = await getDriver(user.uid);
        if (driver && driver.isApproved) {
          router.replace("/kangdomie/dashboard");
          return;
        }
      }
      router.replace("/kangdomie/login");
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}
