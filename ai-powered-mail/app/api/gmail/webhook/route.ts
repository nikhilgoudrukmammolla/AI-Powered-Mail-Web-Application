import { NextRequest, NextResponse } from "next/server";
import { storeNewMailNotification } from "@/lib/redis";

// Google Cloud Pub/Sub sends POST requests here when a Gmail mailbox changes.
// The push subscription URL should point to: <your-public-url>/api/gmail/webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;

    if (!message?.data) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    // Decode the Pub/Sub message payload
    const decoded = JSON.parse(
      Buffer.from(message.data, "base64").toString("utf-8")
    );

    const { emailAddress, historyId } = decoded;
    console.log(`[Webhook] New mail notification for ${emailAddress}, historyId: ${historyId}`);

    // Store notification in Redis so polling clients pick it up
    await storeNewMailNotification(emailAddress, historyId);

    // Pub/Sub expects a 2xx to acknowledge the message
    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
