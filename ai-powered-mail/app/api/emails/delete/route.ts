import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  batchTrash,
  batchDeletePermanently,
  countMatching,
  listMessageIds,
} from "@/lib/gmail";
import { MailFilter } from "@/lib/types";

/**
 * POST /api/emails/delete
 * Body: {
 *   ids?: string[];        // explicit message IDs to delete
 *   filter?: MailFilter;   // OR delete everything matching a filter
 *   folder?: string;       // label to scope the filter (INBOX | SENT | TRASH). Default INBOX
 *   permanent?: boolean;   // true = irreversible batchDelete, false = move to Trash
 *   preview?: boolean;     // true = only return matching count + ids, do NOT delete
 * }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string;

  let body: {
    ids?: string[];
    filter?: MailFilter;
    folder?: string;
    permanent?: boolean;
    preview?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { ids, filter, folder = "INBOX", permanent = false, preview = false } = body;

  try {
    // Resolve the set of IDs to operate on.
    let targetIds: string[] = [];

    if (ids && ids.length > 0) {
      targetIds = ids;
    } else if (filter) {
      const { ids: matchedIds } = await countMatching(accessToken, filter, [folder]);
      targetIds = matchedIds;
    } else {
      return NextResponse.json(
        { error: "Provide either 'ids' or 'filter'." },
        { status: 400 }
      );
    }

    // Preview mode: just report what would be deleted.
    if (preview) {
      return NextResponse.json({
        preview: true,
        count: targetIds.length,
        ids: targetIds,
        permanent,
      });
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ deleted: 0, permanent, ids: [] });
    }

    if (permanent) {
      await batchDeletePermanently(accessToken, targetIds);
    } else {
      await batchTrash(accessToken, targetIds);
    }

    return NextResponse.json({
      deleted: targetIds.length,
      permanent,
      ids: targetIds,
    });
  } catch (error: any) {
    console.error("Bulk delete error:", error.message);
    return NextResponse.json({ error: "Failed to delete emails" }, { status: 500 });
  }
}
