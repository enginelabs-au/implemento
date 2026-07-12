import { describe, expect, it, vi } from "vitest";
import { chainFromPreferredModel } from "./model-config";
import { completeWithRouter, resolveLlmRuntime } from "./router";

describe("model chain", () => {
  it("starts from preferred gemini model", () => {
    expect(chainFromPreferredModel("gemini-2.5-pro")).toEqual([
      "gemini-2.5-pro",
      "gemini-2.5-flash",
    ]);
  });
});

describe("completeWithRouter", () => {
  it("falls back through gemini models then openrouter nano", async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { model: string };
      calls.push(body.model);
      if (body.model === "openai/gpt-5.4-nano") {
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "nano ok" } }],
          }),
          { status: 200 },
        );
      }
      return new Response("fail", { status: 500 });
    }) as typeof fetch;

    const runtime = resolveLlmRuntime({
      llmModel: "gemini-3.5-flash",
      llmApiKey: "gemini-key",
    });
    runtime.openrouterApiKey = "or-key";

    const result = await completeWithRouter(runtime, { system: "s", user: "u" }, {
      fetchImpl,
    });

    expect(result.content).toBe("nano ok");
    expect(calls).toEqual([
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "openai/gpt-5.4-nano",
    ]);
  });

  it("skips hard-task model when daily spend cap is reached", async () => {
    const fetchMock = vi.fn(async () => new Response("fail", { status: 500 }));
    const fetchImpl = fetchMock as typeof fetch;

    const runtime = resolveLlmRuntime({
      llmModel: "gemini-3.5-flash",
      llmApiKey: "gemini-key",
    });
    runtime.openrouterApiKey = "or-key";

    await expect(
      completeWithRouter(runtime, { system: "s", user: "u" }, {
        hardTaskSpend: { date: new Date().toISOString().slice(0, 10), usd: 1 },
        onHardTaskSpend: vi.fn(),
        fetchImpl,
      }),
    ).rejects.toThrow(/All LLM providers failed/);

    expect(fetchMock.mock.calls.length).toBe(5);
  });
});
