import { describe, expect, it } from "vitest";
import { createLlmAdapter, toPublicSettings } from "./llm-adapter";
import { BUILD_LLM_SECRETS } from "./secrets.generated";

describe("llm adapter", () => {
  it("reports not configured when build secrets are missing", () => {
    const adapter = createLlmAdapter({});
    if (!BUILD_LLM_SECRETS.geminiApiKey || !BUILD_LLM_SECRETS.openrouterApiKey) {
      expect(adapter.isConfigured()).toBe(false);
    }
  });

  it("reports configured when build secrets exist", () => {
    if (!BUILD_LLM_SECRETS.geminiApiKey || !BUILD_LLM_SECRETS.openrouterApiKey) {
      return;
    }
    const adapter = createLlmAdapter({ model: "gemini-3.5-flash" });
    expect(adapter.isConfigured()).toBe(true);
  });

  it("never exposes api key in public settings", () => {
    const publicSettings = toPublicSettings({
      llmApiKey: "secret-key",
      llmModel: "gemini-3.5-flash",
      llmTemperature: 0.3,
    });
    expect(JSON.stringify(publicSettings)).not.toContain("secret-key");
    expect(publicSettings.models.length).toBeGreaterThan(0);
  });
});
