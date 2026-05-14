import { NextResponse } from "next/server";
import { collection, getDocs, updateDoc, doc, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Default stock values per category
const DEFAULT_STOCK: Record<string, number> = {
  "mie": 15,
  "topping-reguler": 10,
  "topping-premium": 5,
  "topping-super": 5,
};

export async function GET(request: Request) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get all menu items to build inventory template
    const menuSnap = await getDocs(query(collection(db, "menu_items")));
    const inventory: Record<string, number> = {};
    for (const d of menuSnap.docs) {
      const data = d.data();
      const category = data.category || "mie";
      inventory[d.id] = DEFAULT_STOCK[category] ?? 10;
    }

    // 2. Reset inventory for ALL approved drivers
    const driversSnap = await getDocs(
      query(collection(db, "kangdomie_drivers"), where("isApproved", "==", true))
    );

    let updated = 0;
    for (const d of driversSnap.docs) {
      await updateDoc(doc(db, "kangdomie_drivers", d.id), {
        inventory,
        lastInventoryReset: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      updated++;
    }

    return NextResponse.json({
      success: true,
      message: `Reset inventory for ${updated} drivers (${menuSnap.docs.length} items)`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Stock reset error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
