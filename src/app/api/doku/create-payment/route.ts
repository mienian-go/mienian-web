import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";


function generateDigest(jsonBody: string): string {
  return crypto.createHash("sha256").update(jsonBody).digest("base64");
}

function generateSignature(
  clientId: string,
  requestId: string,
  timestamp: string,
  target: string,
  digest: string,
  secretKey: string
): string {
  const componentString =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:${target}\n` +
    `Digest:${digest}`;

  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(componentString);
  return `HMACSHA256=${hmac.digest("base64")}`;
}

export async function POST(req: NextRequest) {
  try {
    const CLIENT_ID = process.env.DOKU_CLIENT_ID || "";
    const SECRET_KEY = process.env.DOKU_SECRET_KEY || "";
    const BASE_URL = process.env.DOKU_BASE_URL || "https://api-sandbox.doku.com";
    const CHECKOUT_PATH = "/checkout/v1/payment";

    const body = await req.json();
    const { orderId, amount, customerName, customerEmail, invoiceNumber } = body;

    if (!orderId || !amount || !invoiceNumber) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, amount, invoiceNumber" },
        { status: 400 }
      );
    }

    // Build DOKU request payload
    const dokuPayload: any = {
      order: {
        amount: Math.round(amount),
        invoice_number: invoiceNumber,
      },
      payment: {
        payment_due_date: 60, // 60 minutes to pay
      },
    };

    // Add customer info if available
    if (customerName || customerEmail) {
      dokuPayload.customer = {};
      if (customerName) dokuPayload.customer.name = customerName;
      if (customerEmail) dokuPayload.customer.email = customerEmail;
    }

    const jsonBody = JSON.stringify(dokuPayload);
    const requestId = `REQ-${orderId}-${Date.now()}`;
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const digest = generateDigest(jsonBody);
    const signature = generateSignature(
      CLIENT_ID,
      requestId,
      timestamp,
      CHECKOUT_PATH,
      digest,
      SECRET_KEY
    );

    console.log("SENDING TO DOKU WITH CLIENT_ID:", CLIENT_ID);

    // Call DOKU API
    const dokuResponse = await fetch(`${BASE_URL}${CHECKOUT_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": CLIENT_ID,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        Signature: signature,
      },
      body: jsonBody,
    });

    const dokuData = await dokuResponse.json();

    if (!dokuResponse.ok) {
      console.error("DOKU API Error:", JSON.stringify(dokuData, null, 2));
      return NextResponse.json(
        { error: "DOKU payment creation failed", details: dokuData },
        { status: dokuResponse.status }
      );
    }

    // Return payment URL to frontend
    return NextResponse.json({
      paymentUrl: dokuData.response?.payment?.url || dokuData.payment?.url,
      sessionId: dokuData.response?.uuid || dokuData.uuid,
      message: dokuData.message || "Payment created",
      raw: dokuData, // for debugging in sandbox
    });
  } catch (error: any) {
    console.error("Create Payment Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
