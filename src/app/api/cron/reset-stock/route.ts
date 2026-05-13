import { NextResponse } from "next/server";
import { collection, getDocs, updateDoc, doc, query, Timestamp } from "firebase/firestore";
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
    const snap = await getDocs(query(collection(db, "menu_items")));
    let updated = 0;

    for (const d of snap.docs) {
      const data = d.data();
      const category = data.category || "mie";
      const defaultStock = DEFAULT_STOCK[category] ?? 10;

      await updateDoc(doc(db, "menu_items", d.id), {
        stock: defaultStock,
        lastStockReset: Timestamp.now(),
      });
      updated++;
    }

    return NextResponse.json({
      success: true,
      message: `Reset ${updated} menu items stock`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Stock reset error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
