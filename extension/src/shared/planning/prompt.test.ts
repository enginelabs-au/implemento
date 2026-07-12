import { describe, expect, it } from "vitest";
import type { PainTheme } from "../types/domain";
import {
  buildBlueprintSystemPrompt,
  buildBlueprintUserPrompt,
  buildPhase0SystemPrompt,
  buildPhase0UserPrompt,
  truncateBlueprintMarkdown,
} from "./prompt";

const sampleTheme: PainTheme = {
  id: "theme-1",
  sessionId: "session-1",
  title: "Workflow fragmentation",
  summary: "Founders lose context between Reddit and planning.",
  evidenceIds: ["ev-1"],
  severity: 8,
  frequency: "high",
  inferenceFlag: false,
  workaroundPhrases: ["spreadsheets"],
  buyerSignals: ["would pay"],
};

describe("planning prompt", () => {
  it("includes themes in blueprint user prompt", () => {
    const prompt = buildBlueprintUserPrompt({
      sessionName: "SaaS research",
      projectTitle: "Workflow Tool",
      themes: [sampleTheme],
      evidence: [
        {
          id: "ev-1",
          sessionId: "session-1",
          redditUrl: "https://reddit.com/r/SaaS/comments/abc",
          subreddit: "SaaS",
          quote: "I copy everything into spreadsheets",
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
          promoPolicy: "Disclose",
          rulesNotes: "",
        },
      ],
    });

    expect(prompt).toContain("Workflow fragmentation");
    expect(prompt).toContain("ev-1");
    expect(buildBlueprintSystemPrompt()).toContain("JSON only");
  });

  it("includes blueprint excerpt in phase 0 prompt", () => {
    const blueprint = "# Blueprint\n\n## 1. Executive decision\n\nBuild it.";
    const prompt = buildPhase0UserPrompt({
      sessionName: "SaaS research",
      blueprintMarkdown: blueprint,
      themes: [sampleTheme],
    });

    expect(prompt).toContain("Executive decision");
    expect(buildPhase0SystemPrompt()).toContain("phase 0");
  });

  it("truncates long blueprint input", () => {
    const long = "a".repeat(15000);
    expect(truncateBlueprintMarkdown(long).length).toBeLessThan(15000);
    expect(truncateBlueprintMarkdown(long)).toContain("truncated");
  });
});
