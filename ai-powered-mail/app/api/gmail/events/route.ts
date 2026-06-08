import { emailEventEmitter } from "@/lib/gmail-events";

export const dynamic = "force-dynamic";

// Server-Sent Events endpoint: frontend subscribes here to get
// real-time notifications when Gmail sends a Pub/Sub push.
export async function GET() {
  const encoder = new TextEncoder();

  let onNewEmail: ((data: { emailAddress: string; historyId: string }) => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      onNewEmail = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream already closed
        }
      };

      // Keep-alive heartbeat every 30 seconds
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat!);
        }
      }, 30000);

      emailEventEmitter.on("new-email", onNewEmail);

      // Send initial connected message
      controller.enqueue(encoder.encode(": connected\n\n"));
    },
    cancel() {
      if (onNewEmail) emailEventEmitter.off("new-email", onNewEmail);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
