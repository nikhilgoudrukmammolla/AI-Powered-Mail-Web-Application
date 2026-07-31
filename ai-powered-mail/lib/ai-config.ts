// Shared, dependency-free AI provider config types and helpers.
// Safe to import from both client and server (no AI SDK imports here).

export type AIProvider = "azure" | "openai";

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  // Azure OpenAI
  azureResourceName?: string;
  azureDeployment?: string;
  azureApiVersion?: string;
  // OpenAI
  openaiModel?: string;
  openaiBaseURL?: string;
}

// localStorage key where the browser keeps the user's config.
export const AI_CONFIG_STORAGE_KEY = "ai-provider-config";

// Header names used to forward the config to the CopilotKit runtime route.
export const AI_HEADERS = {
  provider: "x-ai-provider",
  apiKey: "x-ai-api-key",
  azureResource: "x-azure-resource",
  azureDeployment: "x-azure-deployment",
  azureApiVersion: "x-azure-api-version",
  openaiModel: "x-openai-model",
  openaiBaseURL: "x-openai-base-url",
} as const;

// Returns true when the config has everything needed for its provider.
export function isConfigComplete(config: AIProviderConfig | null | undefined): boolean {
  if (!config || !config.apiKey) return false;
  if (config.provider === "azure") {
    return Boolean(config.azureResourceName && config.azureDeployment);
  }
  if (config.provider === "openai") {
    return Boolean(config.openaiModel);
  }
  return false;
}

// Serialize a config to the request headers understood by the runtime route.
export function configToHeaders(config: AIProviderConfig | null): Record<string, string> {
  if (!config) return {};
  const headers: Record<string, string> = {
    [AI_HEADERS.provider]: config.provider,
    [AI_HEADERS.apiKey]: config.apiKey || "",
  };
  if (config.provider === "azure") {
    if (config.azureResourceName) headers[AI_HEADERS.azureResource] = config.azureResourceName;
    if (config.azureDeployment) headers[AI_HEADERS.azureDeployment] = config.azureDeployment;
    if (config.azureApiVersion) headers[AI_HEADERS.azureApiVersion] = config.azureApiVersion;
  } else if (config.provider === "openai") {
    if (config.openaiModel) headers[AI_HEADERS.openaiModel] = config.openaiModel;
    if (config.openaiBaseURL) headers[AI_HEADERS.openaiBaseURL] = config.openaiBaseURL;
  }
  return headers;
}
