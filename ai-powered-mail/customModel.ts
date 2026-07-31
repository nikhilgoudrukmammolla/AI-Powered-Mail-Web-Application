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

// Optional fallback built from server env vars (Azure). Returns null when the
// env vars are not present, so the app never crashes at startup for users who
// rely solely on bring-your-own-key configuration.
export function buildDefaultModelFromEnv(): LanguageModel | null {
  const resourceName = process.env.AZURE_OPENAI_API_INSTANCE_NAME;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;

  if (!resourceName || !apiKey || !deploymentName) return null;

  return buildModel({
    provider: "azure",
    apiKey,
    azureResourceName: resourceName,
    azureDeployment: deploymentName,
  });
}