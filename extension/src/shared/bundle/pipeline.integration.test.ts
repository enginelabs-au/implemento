import { describe, expect, it } from "vitest";
import { createStorageAdapter } from "../storage/storage-adapter";

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

describe("pipeline storage lifecycle", () => {
  it("supports evidence through drafts without LLM", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Pipeline");

    await adapter.addEvidence({
      sessionId: session.id,
      redditUrl: "https://reddit.com/r/SaaS/comments/x",
      subreddit: "SaaS",
      quote: "Pain evidence",
      type: "comment",
      tags: [],
    });

    await adapter.replacePainThemes(session.id, [
      {
        id: "theme-1",
        sessionId: session.id,
        title: "Workflow pain",
        summary: "Context loss",
        evidenceIds: ["ev-1"],
        severity: 8,
        frequency: "high",
        inferenceFlag: false,
        workaroundPhrases: ["spreadsheets"],
        buyerSignals: [],
      },
    ]);

    await adapter.upsertBlueprint(session.id, "# Blueprint\n\n## 1. Executive decision\n\nBuild.");
    await adapter.upsertPhasePlan(session.id, 0, "# Phase 0\n\n## 1. Objective\n\nFoundations.");
    await adapter.replacePostDraftsForSubreddits(session.id, ["SaaS"], [
      {
        id: "draft-1",
        sessionId: session.id,
        subreddit: "SaaS",
        archetype: "problem-first",
        title: "Title",
        body: "Body",
        riskNotes: "Low",
        promoRisk: "low",
      },
    ]);

    expect(await adapter.listEvidence(session.id)).toHaveLength(1);
    expect(await adapter.listPainThemes(session.id)).toHaveLength(1);
    expect(await adapter.getBlueprint(session.id)).not.toBeNull();
    expect(await adapter.getPhasePlan(session.id, 0)).not.toBeNull();
    expect(await adapter.listPostDrafts(session.id)).toHaveLength(1);
  });
});
