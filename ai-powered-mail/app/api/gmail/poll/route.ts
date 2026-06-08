import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkNewMailNotification } from "@/lib/redis";

// GET /api/gmail/poll?since=<timestamp>
// Lightweight endpoint the client polls every ~15 seconds.
// Returns { hasNew: true, historyId } if a Pub/Sub notification
// arrived after the given timestamp, otherwise { hasNew: false }.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = Number(req.nextUrl.searchParams.get("since") || "0");
  const notification = await checkNewMailNotification(session.user.email, since);

  if (notification) {
    return NextResponse.json({ hasNew: true, historyId: notification.historyId, timestamp: notification.timestamp });
  }

  return NextResponse.json({ hasNew: false });
}
