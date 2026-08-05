import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { AIProviderConfig } from "@/lib/ai-config";

export type { AIProvider, AIProviderConfig } from "@/lib/ai-config";

// Build a language model from an explicit user-supplied config.
// Returns null if the config is incomplete for the chosen provider.
export function buildModel(config: AIProviderConfig): LanguageModel | null {
  if (!config?.apiKey) return null;

  if (config.provider === "azure") {
    if (!config.azureResourceName || !config.azureDeployment) return null;
    const azure = createAzure({
      resourceName: config.azureResourceName,
      apiKey: config.apiKey,
      ...(config.azureApiVersion ? { apiVersion: config.azureApiVersion } : {}),
    });
    return azure(config.azureDeployment);
  }

  if (config.provider === "openai") {
    const openai = createOpenAI({
      apiKey: config.apiKey,
      ...(config.openaiBaseURL ? { baseURL: config.openaiBaseURL } : {}),
    });
    return openai(config.openaiModel || "gpt-4o-mini");
  }

  return null;
}

// A harmless, non-functional model used ONLY so the CopilotKit runtime can be
// constructed (its `agents` map must be non-empty) and can answer the client's
// initial runtime-info handshake when the user has NOT supplied their own keys.
// It carries a fake key, so it can never run on our credentials — and the UI
// blocks real chat requests until valid user keys are provided.
export function buildPlaceholderModel(): LanguageModel {
  const openai = createOpenAI({ apiKey: "not-configured" });
  return openai("gpt-4o-mini");
}