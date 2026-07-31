import {
  CopilotRuntime,
  BuiltInAgent,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { NextRequest, NextResponse } from "next/server";
import type { LanguageModel } from "ai";
import { buildModel, buildDefaultModelFromEnv } from "@/customModel";
import { AI_HEADERS, type AIProvider, type AIProviderConfig } from "@/lib/ai-config";

// Reconstruct the user's provider config from the forwarded request headers.
function configFromHeaders(req: NextRequest): AIProviderConfig | null {
  const provider = req.headers.get(AI_HEADERS.provider) as AIProvider | null;
  const apiKey = req.headers.get(AI_HEADERS.apiKey) ?? "";
  if (!provider || !apiKey) return null;

  return {
    provider,
    apiKey,
    azureResourceName: req.headers.get(AI_HEADERS.azureResource) ?? undefined,
    azureDeployment: req.headers.get(AI_HEADERS.azureDeployment) ?? undefined,
    azureApiVersion: req.headers.get(AI_HEADERS.azureApiVersion) ?? undefined,
    openaiModel: req.headers.get(AI_HEADERS.openaiModel) ?? undefined,
    openaiBaseURL: req.headers.get(AI_HEADERS.openaiBaseURL) ?? undefined,
  };
}

// Resolve the model to use for this request: prefer the user's config from
// headers, otherwise fall back to server env vars (if configured).
function resolveModel(req: NextRequest): LanguageModel | null {
  const userConfig = configFromHeaders(req);
  if (userConfig) {
    const model = buildModel(userConfig);
    if (model) return model;
  }
  return buildDefaultModelFromEnv();
}

export const POST = async (req: NextRequest) => {
  const model = resolveModel(req);

  if (!model) {
    return NextResponse.json(
      {
        error:
          "No AI provider configured. Open the Keys panel and add your Azure or OpenAI credentials.",
      },
      { status: 400 }
    );
  }

  const runtime = new CopilotRuntime({
    agents: { default: new BuiltInAgent({ model }) },
  });

  const handler = createCopilotRuntimeHandler({
    runtime,
    basePath: "/api/copilotkit",
    mode: "single-route",
    cors: false,
  });

  return handler(req);
};