import { describe, expect, it } from "vitest";
import {
  createStorageAdapter,
  mergeWithDefaults,
} from "../storage/storage-adapter";
import { createResearchSession } from "../types/domain";

function createMemoryStorage() {
  const store = new Map<string, unknown>();
  return {
    async get(keys: string | string[] | null) {
      if (keys === null) {
        return Object.fromEntries(store.entries());
      }
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

describe("storage adapter", () => {
  it("returns defaults for empty storage", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const data = await adapter.getAll();
    expect(data.sessions).toEqual([]);
    expect(data.settings).toEqual({});
  });

  it("round-trips a research session", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = createResearchSession("Sample session");
    await adapter.upsertSession(session);

    const sessions = await adapter.getSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toEqual(session);
  });

  it("merges partial storage with defaults", () => {
    const merged = mergeWithDefaults({ sessions: [createResearchSession("A")] });
    expect(merged.evidence).toEqual([]);
    expect(merged.sessions).toHaveLength(1);
  });

  it("creates session and sets active id", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Market research");
    const activeId = await adapter.getActiveSessionId();
    expect(activeId).toBe(session.id);
  });

  it("adds and lists evidence", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Test");

    const { evidence, duplicate } = await adapter.addEvidence({
      sessionId: session.id,
      redditUrl: "https://reddit.com/r/SaaS/comments/abc/test",
      subreddit: "SaaS",
      quote: "Manual research is painful",
      type: "post",
      tags: [],
    });

    expect(duplicate).toBe(false);
    expect(evidence.quote).toContain("painful");

    const listed = await adapter.listEvidence(session.id);
    expect(listed).toHaveLength(1);
  });

  it("dedupes identical evidence", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Dedupe");

    const first = await adapter.addEvidence({
      sessionId: session.id,
      redditUrl: "https://reddit.com/r/SaaS/comments/abc/test",
      subreddit: "SaaS",
      quote: "Same quote",
      type: "post",
      tags: [],
    });
    const second = await adapter.addEvidence({
      sessionId: session.id,
      redditUrl: "https://reddit.com/r/SaaS/comments/abc/test",
      subreddit: "SaaS",
      quote: "same   quote",
      type: "post",
      tags: [],
    });

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(await adapter.listEvidence(session.id)).toHaveLength(1);
  });

  it("tracks subreddits on session when evidence added", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Subs");
    await adapter.addEvidence({
      sessionId: session.id,
      redditUrl: "https://reddit.com/r/startups/comments/x",
      subreddit: "startups",
      quote: "Need better validation tools",
      type: "post",
      tags: [],
    });

    const sessions = await adapter.getSessions();
    expect(sessions[0].subreddits).toContain("startups");
  });

  it("removes evidence by id", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Remove");
    const { evidence } = await adapter.addEvidence({
      sessionId: session.id,
      redditUrl: "https://reddit.com/r/SaaS/comments/abc",
      subreddit: "SaaS",
      quote: "Remove me",
      type: "comment",
      tags: [],
    });

    expect(await adapter.removeEvidence(evidence.id)).toBe(true);
    expect(await adapter.listEvidence(session.id)).toHaveLength(0);
  });

  it("removes only auto-collected evidence for a session", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Auto clear");
    await adapter.addEvidence({
      sessionId: session.id,
      redditUrl: "https://reddit.com/r/SaaS/comments/manual",
      subreddit: "SaaS",
      quote: "Manual pin",
      type: "comment",
      tags: [],
    });
    await adapter.addEvidence({
      sessionId: session.id,
      redditUrl: "https://reddit.com/r/SaaS/comments/auto",
      subreddit: "SaaS",
      quote: "Auto collect",
      type: "search_result",
      tags: ["auto-collect"],
    });

    const removed = await adapter.removeAutoCollectedEvidence(session.id);
    expect(removed).toBe(1);
    const remaining = await adapter.listEvidence(session.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].quote).toBe("Manual pin");
  });

  it("seeds community profiles when empty", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    await adapter.ensureSeedProfiles();
    const profiles = await adapter.listCommunityProfiles();
    expect(profiles.length).toBe(5);
    expect(profiles.map((p) => p.subreddit)).toContain("SaaS");
  });

  it("replaces pain themes for a session", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Themes");
    await adapter.replacePainThemes(session.id, [
      {
        id: "theme-1",
        sessionId: session.id,
        title: "Pain A",
        summary: "Summary",
        evidenceIds: ["ev-1"],
        severity: 7,
        frequency: "high",
        inferenceFlag: false,
        workaroundPhrases: [],
        buyerSignals: [],
      },
    ]);
    const themes = await adapter.listPainThemes(session.id);
    expect(themes).toHaveLength(1);
    await adapter.replacePainThemes(session.id, []);
    expect(await adapter.listPainThemes(session.id)).toHaveLength(0);
  });

  it("masks api key in public settings", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    await adapter.saveSettings({
      model: "gemini-3.5-flash",
    });
    const publicSettings = await adapter.getPublicSettings();
    expect(publicSettings.model).toBe("gemini-3.5-flash");
    expect(JSON.stringify(publicSettings)).not.toContain("secret");
  });

  it("upserts blueprint and bumps version", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Planning");
    const first = await adapter.upsertBlueprint(session.id, "# Blueprint v1");
    const second = await adapter.upsertBlueprint(session.id, "# Blueprint v2");
    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect((await adapter.getBlueprint(session.id))?.markdown).toContain("v2");
  });

  it("upserts and marks phase 0 plan status", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Phase0");
    const plan = await adapter.upsertPhasePlan(session.id, 0, "# Phase 0");
    expect(plan.status).toBe("draft");
    const updated = await adapter.markPhasePlanStatus(session.id, 0, "complete");
    expect(updated?.status).toBe("complete");
  });

  it("replaces post drafts for selected subreddits", async () => {
    const adapter = createStorageAdapter(createMemoryStorage());
    const session = await adapter.createSession("Posts");
    await adapter.replacePostDraftsForSubreddits(session.id, ["SaaS"], [
      {
        id: "d1",
        sessionId: session.id,
        subreddit: "SaaS",
        archetype: "problem-first",
        title: "Title",
        body: "Body",
        riskNotes: "Low risk",
        promoRisk: "low",
      },
    ]);
    await adapter.replacePostDraftsForSubreddits(session.id, ["SaaS"], [
      {
        id: "d2",
        sessionId: session.id,
        subreddit: "SaaS",
        archetype: "transparent-build",
        title: "New",
        body: "New body",
        riskNotes: "Notes",
        promoRisk: "medium",
      },
    ]);
    const drafts = await adapter.listPostDrafts(session.id);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].archetype).toBe("transparent-build");
  });
});
