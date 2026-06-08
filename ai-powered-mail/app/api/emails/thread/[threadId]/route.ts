import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchThread } from "@/lib/gmail";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const accessToken = (session as any).accessToken as string;

  try {
    const threadMessages = await fetchThread(accessToken, threadId);
    return NextResponse.json(threadMessages);
  } catch (error: any) {
    console.error("Thread fetch error:", error.message);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}
