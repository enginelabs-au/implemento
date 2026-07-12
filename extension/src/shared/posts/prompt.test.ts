import { describe, expect, it } from "vitest";
import { buildPostDraftsSystemPrompt, buildPostDraftsUserPrompt } from "./prompt";

describe("post prompt", () => {
  it("includes subreddit and archetypes in prompts", () => {
    const user = buildPostDraftsUserPrompt({
      subreddit: "SaaS",
      sessionName: "Market research",
      blueprintMarkdown: "## 1. Executive decision\n\nBuild an extension.",
      themes: [
        {
          id: "t1",
          sessionId: "s1",
          title: "Workflow pain",
          summary: "Context is lost",
          evidenceIds: [],
          severity: 8,
          frequency: "high",
          inferenceFlag: false,
          workaroundPhrases: [],
          buyerSignals: [],
        },
      ],
      profile: {
        subreddit: "SaaS",
        tone: "Founder-to-founder",
        postPatterns: ["Pain-first"],
        promoPolicy: "Disclose affiliation",
        rulesNotes: "",
      },
    });

    expect(user).toContain("r/SaaS");
    expect(user).toContain("Disclose affiliation");
    expect(user).toContain("Workflow pain");
    expect(buildPostDraftsSystemPrompt()).toContain("problem-first");
  });
});
