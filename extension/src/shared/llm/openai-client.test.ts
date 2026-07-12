import { describe, expect, it, vi } from "vitest";
import { callChatCompletions, extractApiOriginPattern } from "./openai-client";

describe("openai client", () => {
  it("normalizes completions url", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "ok" } }],
      }),
    });

    await callChatCompletions(
      {
        apiUrl: "https://api.example.com/v1",
        apiKey: "test-key",
        model: "gpt-test",
        provider: "gemini",
        system: "sys",
        user: "user",
      },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      }),
    );
  });

  it("extracts api origin pattern", () => {
    expect(extractApiOriginPattern("https://api.openai.com/v1")).toBe(
      "https://api.openai.com/*",
    );
  });
});
