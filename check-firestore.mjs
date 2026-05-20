import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const snap = await getDocs(collection(db, "kangdomie_locations"));
  snap.forEach(doc => {
    const data = doc.data();
    console.log("ID:", doc.id);
    console.log("Name:", data.name);
    console.log("Driver Name:", data.driverName);
    console.log("Status:", data.status);
    console.log("Timestamp:", data.lastUpdated ? data.lastUpdated.toDate() : "NONE");
    console.log("-------------");
  });
}

check().then(() => process.exit(0)).catch(console.error);
