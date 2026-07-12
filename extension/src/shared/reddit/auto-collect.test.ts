import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { buildAutoCollectPlan, evidenceFromPageContext } from "./auto-collect";
import { parsePageContext } from "./parsers";

const fixturesDir = resolve(__dirname, "fixtures");

describe("auto-collect plan", () => {
  it("builds search and subreddit urls", () => {
    const plan = buildAutoCollectPlan({
      query: "saas pain",
      subreddits: ["SaaS", "r/startups"],
    });
    expect(plan.urls).toEqual([
      "https://www.reddit.com/search/?q=saas%20pain",
      "https://www.reddit.com/r/SaaS/",
      "https://www.reddit.com/r/startups/",
    ]);
  });
});

describe("evidence from page context", () => {
  it("collects subreddit feed posts", () => {
    const html = readFileSync(resolve(fixturesDir, "subreddit.html"), "utf8");
    const window = new Window();
    window.document.write(html);
    const context = parsePageContext(
      window.document as unknown as Document,
      "https://www.reddit.com/r/SaaS/",
    );

    const items = evidenceFromPageContext(context);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].type).toBe("search_result");
    expect(items[0].tags).toContain("auto-collect");
    expect(items[0].quote).toContain("validate");
  });
});
