import {
  CopilotRuntime,
  BuiltInAgent,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { NextRequest, NextResponse } from "next/server";
import type { LanguageModel } from "ai";
import { buildModel, buildPlaceholderModel } from "@/customModel";
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

// Resolve the model to use for this request. ONLY the user's bring-your-own
// credentials (forwarded as request headers) are honored. There is intentionally
// NO server env-var fallback — the assistant must never run on our keys.
function resolveModel(req: NextRequest): LanguageModel | null {
  const userConfig = configFromHeaders(req);
  if (!userConfig) return null;
  return buildModel(userConfig);
}

export const POST = async (req: NextRequest) => {
  // Diagnostic: log whether the user's AI credentials arrived on this request.
  const dbgProvider = req.headers.get(AI_HEADERS.provider);
  const dbgHasKey = Boolean(req.headers.get(AI_HEADERS.apiKey));
  console.log(
    `[copilotkit] request — provider=${dbgProvider ?? "(none)"} userKey=${dbgHasKey} ` +
      `azureDeployment=${req.headers.get(AI_HEADERS.azureDeployment) ?? "-"} ` +
      `openaiModel=${req.headers.get(AI_HEADERS.openaiModel) ?? "-"}`
  );

  // Always construct a valid runtime so CopilotKit's initial runtime-info
  // handshake succeeds. When the user hasn't supplied their own keys we use a
  // non-functional placeholder model (never our credentials); the UI blocks
  // real chat requests until valid keys are entered, so it is never invoked.
  let model: LanguageModel;
  let usingPlaceholder = false;
  try {
    const userModel = resolveModel(req);
    if (userModel) {
      model = userModel;
    } else {
      model = buildPlaceholderModel();
      usingPlaceholder = true;
    }
  } catch (err) {
    console.error("[copilotkit] Failed to build model from user config:", err);
    model = buildPlaceholderModel();
    usingPlaceholder = true;
  }
  if (usingPlaceholder) {
    console.log("[copilotkit] using placeholder model (no valid user keys on this request)");
  }

  try {
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
  } catch (err) {
    console.error("[copilotkit] Runtime handler error:", err);
    return NextResponse.json(
      {
        error:
          "The AI request failed. This usually means your API key, deployment, or model name is incorrect. Please verify your credentials in the Keys panel.",
      },
      { status: 502 }
    );
  }
};