import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { untrashEmail } from "@/lib/gmail";

/**
 * POST /api/emails/untrash
 * Body: { ids: string[] } — restore one or more emails from Trash.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string;

  let body: { ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ids = body.ids || [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "No ids provided" }, { status: 400 });
  }

  try {
    await Promise.all(ids.map((id) => untrashEmail(accessToken, id)));
    return NextResponse.json({ restored: ids.length, ids });
  } catch (error: any) {
    console.error("Untrash error:", error.message);
    return NextResponse.json({ error: "Failed to restore emails" }, { status: 500 });
  }
}
