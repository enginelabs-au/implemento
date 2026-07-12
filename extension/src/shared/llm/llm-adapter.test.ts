import { describe, expect, it } from "vitest";
import { createLlmAdapter, toPublicSettings } from "./llm-adapter";

describe("llm adapter", () => {
  it("reports not configured when settings are missing", () => {
    const adapter = createLlmAdapter({});
    expect(adapter.isConfigured()).toBe(false);
  });

  it("reports configured when all settings exist", () => {
    const adapter = createLlmAdapter({
      apiUrl: "https://api.example.com/v1",
      apiKey: "test-key",
      model: "gpt-4.1-mini",
    });
    expect(adapter.isConfigured()).toBe(true);
  });

  it("never exposes api key in public settings", () => {
    const publicSettings = toPublicSettings({
      llmApiUrl: "https://api.example.com/v1",
      llmApiKey: "secret-key",
      llmModel: "gpt-4.1-mini",
      llmTemperature: 0.3,
    });
    expect(publicSettings.configured).toBe(true);
    expect(publicSettings.apiUrl).toBe("https://api.example.com/v1");
    expect(JSON.stringify(publicSettings)).not.toContain("secret-key");
  });
});
