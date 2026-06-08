# AI-Powered Mail

A full-featured email client with an integrated AI assistant that can control the UI programmatically — composing emails, navigating between views, searching, and interacting with the interface on the user's behalf through natural language.

## Features

- **Inbox & Sent** — Real email data from Gmail API with pagination (Load More)
- **Compose & Send** — Write and send real emails with To, Subject, Body
- **Email Detail** — Read full email content with thread/conversation view
- **Reply & Forward** — Via UI buttons or AI assistant
- **Real-Time Sync** — Gmail Pub/Sub push notifications → webhook → SSE to frontend (no polling)
- **AI Assistant** — CopilotKit-powered sidebar that controls the UI:
  - Compose/send emails via natural language
  - Search and filter with results updating the main UI
  - Open specific emails by description
  - Reply/forward with context awareness
  - Navigate between views
- **Human-in-the-Loop** — Assistant never auto-sends; drafts are shown for user review
- **Rich UI in Chat** — Email preview cards, draft previews, and status indicators in the assistant panel
- **Thread View** — Collapsible conversation view for email threads
- **Light/Dark Mode** — Toggle in the sidebar, persisted to localStorage
- **Filters** — By date range, sender, keyword, read/unread — via UI controls or assistant

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Lucide icons |
| AI Assistant | CopilotKit (react-core, react-ui, runtime v2) |
| LLM | Azure OpenAI (via @ai-sdk/azure) |
| Auth | NextAuth.js v4 (Google OAuth) |
| Email | Gmail API (googleapis) |
| Real-Time | Google Cloud Pub/Sub → Webhook → Server-Sent Events |
| Testing | Vitest, Testing Library |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Sidebar  │  │  Main View   │  │  AI Assistant     │  │
│  │          │  │  (Inbox/Sent │  │  (CopilotSidebar) │  │
│  │  Inbox   │  │   /Detail/   │  │                   │  │
│  │  Sent    │  │   Compose)   │  │  useCopilotAction │  │
│  │  Compose │  │              │  │  useCopilotRead   │  │
│  │  Theme   │  │              │  │                   │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
│       │               │                  │               │
│       └───────────────┼──────────────────┘               │
│                       │ MailContext (shared state)        │
└───────────────────────┼──────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  /api/emails     /api/copilotkit  /api/gmail/*
  (CRUD)          (AI runtime)     (watch/webhook/SSE)
        │                               │
        ▼                               ▼
   Gmail API                   Google Cloud Pub/Sub
```

**Real-Time Flow:**
```
New Email → Gmail → Pub/Sub Topic → Push Subscription
    → /api/gmail/webhook → EventEmitter → /api/gmail/events (SSE)
    → Frontend receives event → fetchInbox()
```

## Setup & Run Locally

### Prerequisites
- Node.js 18+
- A Google Cloud project with Gmail API and Pub/Sub API enabled
- Azure OpenAI deployment (or modify `customModel.ts` for your LLM)
- [ngrok](https://ngrok.com/) (for local Pub/Sub webhook delivery)

### 1. Clone & Install

```bash
git clone <repo-url>
cd ai-powered-mail
npm install
```

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Gmail API** and **Cloud Pub/Sub API**
3. Create OAuth 2.0 credentials (Web application):
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. OAuth consent screen → add Gmail scopes:
   - `openid`, `email`, `profile`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
5. Add your Google account as a **test user**
6. Create a Pub/Sub **topic** (e.g. `gmail-push`)
7. Grant `gmail-api-push@system.gserviceaccount.com` the **Pub/Sub Publisher** role on the topic
8. Create a **push subscription** pointing to your ngrok URL:
   ```
   https://<your-ngrok-domain>/api/gmail/webhook
   ```

### 3. Environment Variables

Create `.env` in the project root:

```env
# NextAuth
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=<from GCP credentials>
GOOGLE_CLIENT_SECRET=<from GCP credentials>

# Azure OpenAI
AZURE_OPENAI_API_INSTANCE_NAME=<your-resource-name>
AZURE_OPENAI_API_KEY=<your-api-key>
AZURE_OPENAI_API_DEPLOYMENT_NAME=<your-deployment>

# Gmail Push Notifications
GOOGLE_PUBSUB_TOPIC=projects/<project-id>/topics/gmail-push
```

### 4. Start ngrok (for real-time push)

```bash
ngrok http 3000 --domain=<your-static-domain>.ngrok-free.app
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Run Tests

```bash
npm test
```

## Architecture Decisions & Trade-Offs

| Decision | Rationale |
|----------|-----------|
| **CopilotKit v2 runtime** | Needed for BuiltInAgent + AI SDK model support. The v1 API didn't support Azure OpenAI models directly. |
| **In-memory EventEmitter for SSE** | Simple and works perfectly in single-process `next dev`. For production serverless, would need Redis Pub/Sub or similar. |
| **Human-in-the-loop (never auto-send)** | Safety first — the assistant fills the form but always waits for explicit user confirmation. |
| **Gmail API over IMAP** | Better integration with Google ecosystem, cleaner OAuth flow, and native Pub/Sub support for real-time. |
| **Shared MailContext** | Single source of truth for both UI interactions and AI assistant actions — ensures the assistant and UI always stay in sync. |
| **Thread fetched on email open** | Lazy-loads thread messages only when viewing an email, avoiding expensive batch fetches on inbox load. |

## What I'd Improve With More Time

- **Redis/DB-backed SSE** — Replace in-memory EventEmitter with Redis for serverless compatibility
- **Token refresh** — Handle OAuth access token expiration with automatic refresh using the stored refresh token
- **Optimistic UI** — Show sent emails immediately in the UI before server confirmation
- **Email attachments** — Support viewing and sending attachments
- **Batch operations** — Select multiple emails for archive, delete, mark read/unread
- **Keyboard shortcuts** — Gmail-like shortcuts (j/k navigation, r for reply, etc.)
- **E2E tests** — Playwright tests for the full assistant workflow
- **Rate limiting** — Protect API routes from abuse
- **Cron for watch renewal** — Gmail watch expires every 7 days; add automatic renewal
