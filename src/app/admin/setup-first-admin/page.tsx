"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "mienianid@gmail.com";
const ADMIN_PASSWORD = "M13n14n1d";

export default function SetupFirstAdmin() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const router = useRouter();

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const handleSetup = async () => {
    setLoading(true);
    setError("");
    setLog([]);

    try {
      // Step 1: Create or sign in user
      let uid = "";
      addLog("🔄 Mencoba membuat akun Auth...");
      
      try {
        const userCred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        uid = userCred.user.uid;
        addLog("✅ Akun Auth berhasil dibuat. UID: " + uid);
      } catch (authErr: any) {
        if (authErr.code === "auth/email-already-in-use") {
          addLog("⚠️ Akun sudah ada, mencoba sign in...");
          const userCred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
          uid = userCred.user.uid;
          addLog("✅ Berhasil sign in. UID: " + uid);
        } else {
          throw authErr;
        }
      }

      // Step 2: Write admin doc to Firestore
      addLog("🔄 Menyimpan data admin ke Firestore...");
      await setDoc(doc(db, "admins", uid), {
        email: ADMIN_EMAIL,
        role: "superadmin",
        name: "Super Admin Mienian",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      addLog("✅ Data admin berhasil disimpan!");

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/login");
      }, 3000);
    } catch (err: any) {
      console.error("Setup error:", err);
      
      let errorMsg = err.message || "Gagal membuat admin pertama";
      
      if (err.code === "permission-denied" || errorMsg.includes("Missing or insufficient permissions")) {
        errorMsg = "❌ FIRESTORE RULES BELUM TERBUKA. Buka Firebase Console → Firestore Database → tab Rules → ganti isinya menjadi:\n\nrules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}\n\nLalu klik tombol PUBLISH.";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="card max-w-lg w-full p-8 text-center space-y-6">
        <h1 className="text-2xl font-bold">Setup First Admin</h1>
        <p className="text-foreground/50 text-sm">
          Klik tombol di bawah untuk membuat akun admin pertama:
          <br />
          <strong className="text-primary mt-2 block">{ADMIN_EMAIL}</strong>
          <span className="font-mono text-xs">{ADMIN_PASSWORD}</span>
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-lg text-sm text-left whitespace-pre-wrap font-mono">
            {error}
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-muted p-3 rounded-lg text-left text-xs space-y-1 font-mono">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/10 text-green-500 p-4 rounded-lg font-bold">
            Berhasil dibuat! Mengalihkan ke halaman login...
          </div>
        ) : (
          <button
            onClick={handleSetup}
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Memproses..." : "Buat Akun Superadmin"}
          </button>
        )}

        <div className="text-xs text-amber-500 mt-4 bg-amber-500/10 p-3 rounded text-left">
          <strong>Peringatan:</strong> Halaman ini hanya boleh diakses sekali. Setelah sukses, Anda sebaiknya menghapus file ini (<code>src/app/admin/setup-first-admin/page.tsx</code>) demi keamanan.
        </div>
      </div>
    </div>
  );
}
