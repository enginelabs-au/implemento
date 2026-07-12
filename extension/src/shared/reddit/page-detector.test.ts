import { describe, expect, it } from "vitest";
import {
  detectPageTypeFromUrl,
  extractSubredditFromUrl,
} from "./page-detector";

describe("page detector", () => {
  it("detects post pages", () => {
    expect(
      detectPageTypeFromUrl(
        "https://www.reddit.com/r/SaaS/comments/abc123/title/",
      ),
    ).toBe("post");
  });

  it("detects subreddit pages", () => {
    expect(detectPageTypeFromUrl("https://www.reddit.com/r/startups/")).toBe(
      "subreddit",
    );
  });

  it("detects search pages", () => {
    expect(
      detectPageTypeFromUrl("https://www.reddit.com/search/?q=saas+pain"),
    ).toBe("search");
  });

  it("detects profile pages", () => {
    expect(detectPageTypeFromUrl("https://www.reddit.com/user/builder99/")).toBe(
      "profile",
    );
  });

  it("extracts subreddit from url", () => {
    expect(
      extractSubredditFromUrl("https://www.reddit.com/r/indiehackers/comments/x/y"),
    ).toBe("indiehackers");
  });
});
