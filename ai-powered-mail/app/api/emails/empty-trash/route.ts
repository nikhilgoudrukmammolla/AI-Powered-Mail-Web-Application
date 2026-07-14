import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { emptyTrash } from "@/lib/gmail";

/**
 * POST /api/emails/empty-trash
 * Permanently deletes everything currently in the Trash. Irreversible.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string;

  try {
    const deleted = await emptyTrash(accessToken);
    return NextResponse.json({ deleted, permanent: true });
  } catch (error: any) {
    console.error("Empty trash error:", error.message);
    return NextResponse.json({ error: "Failed to empty trash" }, { status: 500 });
  }
}
