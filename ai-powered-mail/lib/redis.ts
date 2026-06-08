import { Redis } from "@upstash/redis";

// Upstash Redis client — works in serverless (Vercel) environments.
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Key helpers
const NOTIFICATION_KEY = (email: string) => `gmail:notify:${email}`;

/**
 * Store a new-mail notification in Redis (called from webhook).
 * TTL of 5 minutes — if the client doesn't poll within that window, the
 * notification expires (the next regular poll will still catch changes).
 */
export async function storeNewMailNotification(
  emailAddress: string,
  historyId: string
) {
  await redis.set(
    NOTIFICATION_KEY(emailAddress),
    JSON.stringify({ historyId, timestamp: Date.now() }),
    { ex: 300 } // expires in 5 minutes
  );
}

/**
 * Check if there's a new-mail notification newer than `since` timestamp.
 * Returns the notification data if found, or null.
 */
export async function checkNewMailNotification(
  emailAddress: string,
  since: number
): Promise<{ historyId: string; timestamp: number } | null> {
  const raw = await redis.get<string>(NOTIFICATION_KEY(emailAddress));
  if (!raw) return null;

  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (data.timestamp > since) return data;
  return null;
}

export { redis };
