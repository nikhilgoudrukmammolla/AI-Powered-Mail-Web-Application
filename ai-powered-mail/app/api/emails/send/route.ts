import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string;
  const { to, subject, body, inReplyTo, threadId } = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 });
  }

  try {
    const result = await sendEmail(accessToken, to, subject, body, inReplyTo, threadId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Gmail send error:", error.message);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
