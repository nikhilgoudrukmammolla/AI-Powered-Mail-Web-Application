import { describe, it, expect } from "vitest";
import * as customModel from "./customModel";
import { buildModel, buildPlaceholderModel } from "./customModel";
import type { AIProviderConfig } from "./lib/ai-config";

describe("no server env-key fallback is exported", () => {
  it("buildDefaultModelFromEnv has been removed", () => {
    expect(
      (customModel as Record<string, unknown>).buildDefaultModelFromEnv
    ).toBeUndefined();
  });
});

describe("buildModel — only builds from complete user config", () => {
  it("returns null when apiKey is missing", () => {
    expect(buildModel({ provider: "openai", apiKey: "" })).toBeNull();
  });

  it("returns null for azure without resource/deployment", () => {
    expect(buildModel({ provider: "azure", apiKey: "k" })).toBeNull();
    expect(
      buildModel({ provider: "azure", apiKey: "k", azureResourceName: "res" })
    ).toBeNull();
    expect(
      buildModel({ provider: "azure", apiKey: "k", azureDeployment: "dep" })
    ).toBeNull();
  });

  it("builds an azure model when config is complete", () => {
    const config: AIProviderConfig = {
      provider: "azure",
      apiKey: "azure-key",
      azureResourceName: "my-res",
      azureDeployment: "my-dep",
    };
    expect(buildModel(config)).not.toBeNull();
  });

  it("builds an openai model when config has a key", () => {
    const config: AIProviderConfig = {
      provider: "openai",
      apiKey: "sk-abc",
      openaiModel: "gpt-4o-mini",
    };
    expect(buildModel(config)).not.toBeNull();
  });

  it("does NOT read process.env (no server-key fallback exists)", () => {
    process.env.AZURE_OPENAI_API_KEY = "should-not-be-used";
    process.env.AZURE_OPENAI_API_INSTANCE_NAME = "should-not-be-used";
    process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME = "should-not-be-used";
    expect(buildModel({ provider: "azure", apiKey: "" })).toBeNull();
    delete process.env.AZURE_OPENAI_API_KEY;
    delete process.env.AZURE_OPENAI_API_INSTANCE_NAME;
    delete process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;
  });
});

describe("buildPlaceholderModel", () => {
  it("returns a non-null model for the runtime-info handshake", () => {
    expect(buildPlaceholderModel()).not.toBeNull();
  });
});
