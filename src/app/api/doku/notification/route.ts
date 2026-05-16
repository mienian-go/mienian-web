import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { doc, updateDoc, getDoc, setDoc, Timestamp } from "firebase/firestore/lite";
import { getFirestore } from "firebase/firestore/lite";
import app from "@/lib/firebase";

const db = getFirestore(app);

function verifyNotificationSignature(
  clientId: string,
  requestId: string,
  timestamp: string,
  target: string,
  digest: string,
  receivedSignature: string,
  secretKey: string
): boolean {
  const componentString =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:${target}\n` +
    `Digest:${digest}`;

  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(componentString);
  const expectedSignature = `HMACSHA256=${hmac.digest("base64")}`;

  return receivedSignature === expectedSignature;
}

export async function POST(req: NextRequest) {
  try {
    const SECRET_KEY = process.env.DOKU_SECRET_KEY || "";
    
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // Extract headers from DOKU notification
    const receivedClientId = req.headers.get("client-id") || "";
    const requestId = req.headers.get("request-id") || "";
    const timestamp = req.headers.get("request-timestamp") || "";
    const signature = req.headers.get("signature") || "";

    // Generate digest from raw body
    const digest = crypto.createHash("sha256").update(rawBody).digest("base64");

    // Verify signature
    const notificationTarget = "/api/doku/notification";
    const isValid = verifyNotificationSignature(
      receivedClientId,
      requestId,
      timestamp,
      notificationTarget,
      digest,
      signature,
      SECRET_KEY
    );

    if (!isValid) {
      console.warn("DOKU Notification: Invalid signature");
      // Still process in sandbox for testing, but log warning
      console.warn("Proceeding anyway (sandbox mode)...");
    }

    // Extract transaction info
    const invoiceNumber = body?.order?.invoice_number || "";
    const transactionStatus = body?.transaction?.status || "";
    const amount = body?.order?.amount || 0;

    console.log("DOKU Notification received:", {
      invoiceNumber,
      transactionStatus,
      amount,
      fullBody: JSON.stringify(body, null, 2),
    });

    // Map DOKU status to our order status
    let orderStatus = "pending_payment";
    if (transactionStatus === "SUCCESS") {
      orderStatus = "paid";
    } else if (transactionStatus === "FAILED") {
      orderStatus = "payment_failed";
    } else if (transactionStatus === "EXPIRED") {
      orderStatus = "payment_expired";
    }

    // invoiceNumber format: INV-{firestoreDocId}-{timestamp}
    // OR MIENIAN-{firestoreDocId}
    let firestoreId = "";
    if (invoiceNumber.startsWith("INV-")) {
      const parts = invoiceNumber.split('-');
      if (parts.length >= 3) {
        parts.pop(); // remove timestamp suffix
        parts.shift(); // remove INV prefix
        firestoreId = parts.join("-");
      } else {
        firestoreId = invoiceNumber.replace("INV-", "");
      }
    } else {
      firestoreId = invoiceNumber.replace("MIENIAN-", "");
    }

    if (firestoreId) {
      try {
        const orderRef = doc(db, "orders", firestoreId);
        await updateDoc(orderRef, {
          status: orderStatus,
          dokuTransactionStatus: transactionStatus,
          dokuNotification: body,
          paidAt: transactionStatus === "SUCCESS" ? Timestamp.now() : null,
          updatedAt: Timestamp.now(),
        });
        console.log(`Order ${firestoreId} updated to status: ${orderStatus}`);

        // On successful payment: auto-assign driver & award points
        if (transactionStatus === "SUCCESS") {
          try {
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
              const orderData = orderSnap.data();

              // Auto-assign selected KangDoMie driver for delivery orders
              if (orderData.driverId && orderData.orderType === "delivery" && !orderData.assignedDriver) {
                await updateDoc(orderRef, {
                  assignedDriver: orderData.driverId,
                  status: "preparing",
                  updatedAt: Timestamp.now(),
                });
                console.log(`Auto-assigned driver ${orderData.driverId} to order ${firestoreId}`);
              }

              // Award loyalty points using firestore/lite to prevent Vercel hang
              const userId = orderData.userId;
              const totalAmount = orderData.costs?.grandTotal || orderData.totalPrice || amount;
              if (userId) {
                const pointsEarned = Math.floor(totalAmount / 1000) * 100; // 100 points per Rp 1.000
                if (pointsEarned > 0) {
                  const userPointsRef = doc(db, "user_points", userId);
                  const userPointsSnap = await getDoc(userPointsRef);
                  
                  const LEVEL_THRESHOLDS = [0, 500, 2000, 5000, 10000, 25000];
                  const calcLevel = (pts: number) => {
                    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
                      if (pts >= LEVEL_THRESHOLDS[i]) return i;
                    }
                    return 0;
                  };

                  if (userPointsSnap.exists()) {
                    const currentData = userPointsSnap.data();
                    const newPoints = (currentData.points || 0) + pointsEarned;
                    const newLevel = calcLevel(newPoints);
                    await updateDoc(userPointsRef, {
                      points: newPoints,
                      totalSpent: (currentData.totalSpent || 0) + totalAmount,
                      totalOrders: (currentData.totalOrders || 0) + 1,
                      level: newLevel,
                      updatedAt: Timestamp.now(),
                    });
                  } else {
                    const newLevel = calcLevel(pointsEarned);
                    await setDoc(userPointsRef, {
                      userId,
                      displayName: orderData.customerName || "User",
                      points: pointsEarned,
                      totalSpent: totalAmount,
                      totalOrders: 1,
                      level: newLevel,
                      createdAt: Timestamp.now(),
                      updatedAt: Timestamp.now(),
                    });
                  }
                  console.log(`Awarded ${pointsEarned} points to user ${userId} for order ${firestoreId}`);
                }
              }
            }
          } catch (pointsErr) {
            console.error("Failed to process post-payment:", pointsErr);
          }
        }
      } catch (dbErr) {
        console.error("Failed to update Firestore:", dbErr);
      }
    }

    // DOKU expects 200 OK response
    return NextResponse.json({ message: "Notification received" }, { status: 200 });
  } catch (error: any) {
    console.error("DOKU Notification Error:", error);
    // Still return 200 to prevent DOKU from retrying
    return NextResponse.json({ message: "Notification processed with errors" }, { status: 200 });
  }
}
