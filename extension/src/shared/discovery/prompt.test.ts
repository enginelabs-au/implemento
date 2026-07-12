import { describe, expect, it } from "vitest";
import {
  buildDiscoverySystemPrompt,
  buildDiscoveryUserPrompt,
  selectEvidenceForPrompt,
  truncateQuote,
} from "./prompt";

describe("discovery prompt", () => {
  it("truncates long quotes", () => {
    const long = "a".repeat(600);
    expect(truncateQuote(long)).toHaveLength(501);
    expect(truncateQuote(long).endsWith("…")).toBe(true);
  });

  it("caps evidence items", () => {
    const evidence = Array.from({ length: 40 }, (_, index) => ({
      id: `ev-${index}`,
      sessionId: "session-1",
      redditUrl: "https://reddit.com/r/SaaS/comments/abc",
      subreddit: "SaaS",
      quote: "quote",
      type: "comment" as const,
      tags: [],
      capturedAt: new Date().toISOString(),
    }));
    expect(selectEvidenceForPrompt(evidence)).toHaveLength(30);
  });

  it("includes evidence ids in user prompt", () => {
    const prompt = buildDiscoveryUserPrompt({
      sessionName: "Test session",
      evidence: [
        {
          id: "evidence-1",
          sessionId: "session-1",
          redditUrl: "https://reddit.com/r/SaaS/comments/abc",
          subreddit: "SaaS",
          quote: "Manual spreadsheets everywhere",
          type: "comment",
          tags: [],
          capturedAt: new Date().toISOString(),
        },
      ],
      profiles: [
        {
          subreddit: "SaaS",
          tone: "Founder-to-founder",
          postPatterns: ["Pain-first"],
          promoPolicy: "Disclose affiliation",
          rulesNotes: "",
        },
      ],
    });

    expect(prompt).toContain("ID: evidence-1");
    expect(prompt).toContain("Manual spreadsheets");
    expect(buildDiscoverySystemPrompt()).toContain("JSON only");
  });
});
