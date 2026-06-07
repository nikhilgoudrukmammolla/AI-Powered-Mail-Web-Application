import { EventEmitter } from "events";

// In-memory event bus for connecting Pub/Sub webhook to SSE streams.
// Works in single-process environments (next dev, Node.js server).
// For serverless production, replace with Redis Pub/Sub or similar.
const emailEventEmitter = new EventEmitter();
emailEventEmitter.setMaxListeners(100);

export { emailEventEmitter };
