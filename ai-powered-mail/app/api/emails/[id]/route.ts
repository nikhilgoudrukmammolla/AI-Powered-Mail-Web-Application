import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchEmailById, markAsRead } from "@/lib/gmail";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const accessToken = (session as any).accessToken as string;

  try {
    const email = await fetchEmailById(accessToken, id);
    // Mark as read when opened
    await markAsRead(accessToken, id);
    return NextResponse.json(email);
  } catch (error: any) {
    console.error("Gmail fetch error:", error.message);
    return NextResponse.json({ error: "Failed to fetch email" }, { status: 500 });
  }
}
