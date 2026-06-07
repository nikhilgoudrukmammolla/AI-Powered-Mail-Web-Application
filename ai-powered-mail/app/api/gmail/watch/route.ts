import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { watchMailbox, stopWatch } from "@/lib/gmail";

// POST /api/gmail/watch — Registers a Gmail push notification watch.
// Must be called once after login and renewed every 7 days.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topicName = process.env.GOOGLE_PUBSUB_TOPIC;
  if (!topicName) {
    return NextResponse.json(
      { error: "GOOGLE_PUBSUB_TOPIC not configured" },
      { status: 500 }
    );
  }

  const accessToken = (session as any).accessToken as string;

  try {
    const result = await watchMailbox(accessToken, topicName);
    console.log(`[Watch] Registered. historyId: ${result.historyId}, expires: ${result.expiration}`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Watch registration error:", error.message);
    return NextResponse.json({ error: "Failed to register watch" }, { status: 500 });
  }
}

// DELETE /api/gmail/watch — Stops the Gmail push notification watch.
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string;

  try {
    await stopWatch(accessToken);
    return NextResponse.json({ status: "stopped" });
  } catch (error: any) {
    console.error("Watch stop error:", error.message);
    return NextResponse.json({ error: "Failed to stop watch" }, { status: 500 });
  }
}
