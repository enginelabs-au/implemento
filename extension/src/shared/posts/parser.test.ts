import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parsePostDraftsResponse } from "./parser";

describe("post parser", () => {
  it("parses fixture into three archetype drafts", () => {
    const fixture = readFileSync(
      resolve(__dirname, "fixtures/sample-posts-response.json"),
      "utf8",
    );
    const drafts = parsePostDraftsResponse(fixture, "session-1", "SaaS");
    expect(drafts).toHaveLength(3);
    expect(drafts.map((d) => d.archetype).sort()).toEqual(
      ["problem-first", "resource-value", "transparent-build"].sort(),
    );
  });

  it("rejects wrong subreddit", () => {
    const fixture = readFileSync(
      resolve(__dirname, "fixtures/sample-posts-response.json"),
      "utf8",
    );
    expect(() => parsePostDraftsResponse(fixture, "session-1", "startups")).toThrow(
      /subreddit/i,
    );
  });
});
