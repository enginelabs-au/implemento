import { describe, expect, it } from "vitest";
import { mergeWithDefaults, createStorageAdapter } from "../storage/storage-adapter";
import { buildSessionBundle, serializeSessionBundle } from "./export";
import { applySessionBundleImport, parseSessionBundleJson } from "./import";
import { assertNoSecretsInBundleJson } from "./schema";
import { createResearchSession } from "../types/domain";

function createMemoryStorage() {
  const store = new Map<string, unknown>();
  return {
    async get(keys: string | string[] | null) {
      if (keys === null) return Object.fromEntries(store.entries());
      const keyList = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(
        keyList
          .map((key) => [key, store.get(key)])
          .filter((entry): entry is [string, unknown] => entry[1] !== undefined),
      );
    },
    async set(items: Record<string, unknown>) {
      for (const [key, value] of Object.entries(items)) {
        store.set(key, value);
      }
    },
  };
}

describe("session bundle", () => {
  it("exports and imports a session round-trip", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Bundle test");
    await adapter.addEvidence({
      sessionId: session.id,
      redditUrl: "https://reddit.com/r/SaaS/comments/abc",
      subreddit: "SaaS",
      quote: "Workflow pain",
      type: "post",
      tags: [],
    });
    await adapter.replacePainThemes(session.id, [
      {
        id: "theme-1",
        sessionId: session.id,
        title: "Pain",
        summary: "Summary",
        evidenceIds: [],
        severity: 7,
        frequency: "high",
        inferenceFlag: false,
        workaroundPhrases: [],
        buyerSignals: [],
      },
    ]);

    const data = await adapter.getAll();
    const bundle = buildSessionBundle(data, session.id);
    expect(bundle).not.toBeNull();

    const json = serializeSessionBundle(bundle!);
    assertNoSecretsInBundleJson(json);
    expect(json).not.toContain("llmApiKey");

    const target = mergeWithDefaults({
      sessions: [session],
      evidence: [],
      painThemes: [],
    });
    const parsed = parseSessionBundleJson(json);
    const result = applySessionBundleImport(target, parsed, { replaceIfExists: false });
    expect(result.sessionId).not.toBe(session.id);
    expect(target.sessions).toHaveLength(2);
    expect(target.evidence).toHaveLength(1);
    expect(target.painThemes).toHaveLength(1);
  });

  it("rejects invalid bundle JSON", () => {
    expect(() => parseSessionBundleJson("{}")).toThrow(/invalid bundle/i);
  });

  it("replaces session when replaceIfExists is true", () => {
    const session = createResearchSession("Old");
    const data = mergeWithDefaults({
      sessions: [session],
      evidence: [
        {
          id: "ev-1",
          sessionId: session.id,
          redditUrl: "https://reddit.com/r/SaaS/comments/a",
          subreddit: "SaaS",
          quote: "old",
          type: "post",
          tags: [],
          capturedAt: new Date().toISOString(),
        },
      ],
    });

    const bundle = buildSessionBundle(data, session.id)!;
    bundle.evidence[0].quote = "new quote";

    applySessionBundleImport(data, bundle, { replaceIfExists: true });
    expect(data.evidence).toHaveLength(1);
    expect(data.evidence[0].quote).toBe("new quote");
  });
});
