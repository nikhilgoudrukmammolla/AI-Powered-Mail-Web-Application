# AI-Powered-Mail-Web-Application

## Setup Instructions:

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run the application

### 1. Clone the repository

clone repository from branch `rng`


### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env` in the project root:

```env
# Azure OpenAI -(required for AI features its for custom provider integration) - if you want to use custom provider
# or you can use the default provider (OpenAI) by commenting out the custom provider code in the ai-powered-mail directory

AZURE_OPENAI_API_KEY=<your-azure-openai-api-key>
AZURE_OPENAI_API_INSTANCE_NAME=<your-azure-openai-instance-name>
AZURE_OPENAI_API_DEPLOYMENT_NAME=<your-azure-openai-deployment-name>
AZURE_OPENAI_API_VERSION=<your-azure-openai-api-version>

# Google OAuth & Pub/Sub (required for real-time push and authentication)- get these from Google Cloud Console
# OAuth

GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Pub/Sub

GOOGLE_PUBSUB_TOPIC=<your-google-pubsub-topic>

# NextAuth

NEXTAUTH_SECRET=<your-nextauth-secret>
NEXTAUTH_URL=<your-nextauth-url>


# Upstash Redis (required for real-time push - get these from Upstash Console)- required because vercel doesn't support websockets

UPSTASH_REDIS_REST_URL=<your-upstash-redis-rest-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-redis-rest-token>
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture Decisions & Trade-Offs

- For UI and backend - I used Next.js with TailwindCSS for styling
- For AI implementation - I used CopilotKit
- For real-time push - I used Upstash Redis
- For authentication - I used Google OAuth
- For deployment - I used Vercel
- In stead of react + node I used Next.js so that I can have server side rendering and client side rendering in the same application. No need to deploy separate backend server.
- I thought of using vercel AI SDK but after seeing the context management and other features I went with CopilotKit
- I thought as I integrated pub/sub which is a webhook based system I can use it for real-time push but I found that it doesn't support websockets and I had to use Upstash Redis for real-time push

## Demo video

[Demo video](https://www.loom.com/share/f63c49bd17fe41fb847524f67daeecac)


## What I'd Improve With More Time

- I want to add more advanced filtering and management features where i can segment emails based on different criteria and delete or managethem in bulk

- Auth flow I just used inmemory session store for simplicity, but in production I'd use a proper database like MongoDB

- I haven't keenly tested the application for security vulnerabilities

- Improve UI and chatbot UI experience. I want to remove the chatbot as a floating element and make it a part of the UI similar to chatGPT and conversation I limit to 1 and the convo will stream upwards. This chat input will be at bottom.

- Im little worried about google pub/sub and its limitations, instead of subscription i would go with backend polling approach which only polls when there is a new email. But for this I need to dockerize the application and run it in a container.
