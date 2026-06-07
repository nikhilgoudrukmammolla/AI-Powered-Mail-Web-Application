import { emailEventEmitter } from "@/lib/gmail-events";

export const dynamic = "force-dynamic";

// Server-Sent Events endpoint: frontend subscribes here to get
// real-time notifications when Gmail sends a Pub/Sub push.
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const onNewEmail = (data: { emailAddress: string; historyId: string }) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream already closed
        }
      };

      // Keep-alive heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      emailEventEmitter.on("new-email", onNewEmail);

      // Send initial connected message
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Cleanup when the stream is cancelled (client disconnects)
      const originalCancel = stream.cancel?.bind(stream);
      stream.cancel = (reason) => {
        emailEventEmitter.off("new-email", onNewEmail);
        clearInterval(heartbeat);
        return originalCancel?.(reason) ?? Promise.resolve();
      };
    },
    cancel() {
      // Additional cleanup hook
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
