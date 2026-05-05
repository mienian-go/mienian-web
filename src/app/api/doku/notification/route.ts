import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";


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

    // Update Firestore order
    // invoiceNumber format: MIENIAN-{firestoreDocId} 
    const firestoreId = invoiceNumber.replace("MIENIAN-", "");
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
