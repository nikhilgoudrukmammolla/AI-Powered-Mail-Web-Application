import { describe, it, expect } from "vitest";
import {
  isConfigComplete,
  configToHeaders,
  AI_HEADERS,
  type AIProviderConfig,
} from "./ai-config";

describe("isConfigComplete", () => {
  it("returns false for null/undefined config", () => {
    expect(isConfigComplete(null)).toBe(false);
    expect(isConfigComplete(undefined)).toBe(false);
  });

  it("returns false when the API key is missing", () => {
    expect(
      isConfigComplete({ provider: "openai", apiKey: "", openaiModel: "gpt-4o-mini" })
    ).toBe(false);
    expect(
      isConfigComplete({
        provider: "azure",
        apiKey: "",
        azureResourceName: "res",
        azureDeployment: "dep",
      })
    ).toBe(false);
  });

  it("requires model for openai", () => {
    expect(isConfigComplete({ provider: "openai", apiKey: "sk-x", openaiModel: "" })).toBe(false);
    expect(
      isConfigComplete({ provider: "openai", apiKey: "sk-x", openaiModel: "gpt-4o-mini" })
    ).toBe(true);
  });

  it("requires resource + deployment for azure", () => {
    expect(
      isConfigComplete({ provider: "azure", apiKey: "k", azureResourceName: "res" })
    ).toBe(false);
    expect(
      isConfigComplete({ provider: "azure", apiKey: "k", azureDeployment: "dep" })
    ).toBe(false);
    expect(
      isConfigComplete({
        provider: "azure",
        apiKey: "k",
        azureResourceName: "res",
        azureDeployment: "dep",
      })
    ).toBe(true);
  });
});

describe("configToHeaders", () => {
  it("returns empty object for null config (no keys forwarded)", () => {
    expect(configToHeaders(null)).toEqual({});
  });

  it("forwards openai config as headers", () => {
    const config: AIProviderConfig = {
      provider: "openai",
      apiKey: "sk-abc",
      openaiModel: "gpt-4o",
      openaiBaseURL: "https://api.openai.com/v1",
    };
    const headers = configToHeaders(config);
    expect(headers[AI_HEADERS.provider]).toBe("openai");
    expect(headers[AI_HEADERS.apiKey]).toBe("sk-abc");
    expect(headers[AI_HEADERS.openaiModel]).toBe("gpt-4o");
    expect(headers[AI_HEADERS.openaiBaseURL]).toBe("https://api.openai.com/v1");
  });

  it("forwards azure config as headers", () => {
    const config: AIProviderConfig = {
      provider: "azure",
      apiKey: "azure-key",
      azureResourceName: "my-res",
      azureDeployment: "my-dep",
      azureApiVersion: "2024-08-01-preview",
    };
    const headers = configToHeaders(config);
    expect(headers[AI_HEADERS.provider]).toBe("azure");
    expect(headers[AI_HEADERS.apiKey]).toBe("azure-key");
    expect(headers[AI_HEADERS.azureResource]).toBe("my-res");
    expect(headers[AI_HEADERS.azureDeployment]).toBe("my-dep");
    expect(headers[AI_HEADERS.azureApiVersion]).toBe("2024-08-01-preview");
  });
});
