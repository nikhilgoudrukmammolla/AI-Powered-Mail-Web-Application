import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchEmails } from "@/lib/gmail";
import { MailFilter } from "@/lib/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string;
  const { searchParams } = new URL(req.url);

  const filter: MailFilter = {};
  if (searchParams.get("q")) filter.query = searchParams.get("q")!;
  if (searchParams.get("from")) filter.from = searchParams.get("from")!;
  if (searchParams.get("to")) filter.to = searchParams.get("to")!;
  if (searchParams.get("after")) filter.after = searchParams.get("after")!;
  if (searchParams.get("before")) filter.before = searchParams.get("before")!;
  if (searchParams.get("unread") === "true") filter.isUnread = true;

  const label = searchParams.get("label") || "INBOX";
  const maxResults = parseInt(searchParams.get("max") || "20", 10);
  const pageToken = searchParams.get("pageToken") || undefined;

  try {
    const result = await fetchEmails(accessToken, filter, maxResults, [label], pageToken);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Gmail fetch error:", error.message);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
