import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { parsePostPage } from "./post";
import { parseSubredditPage } from "./subreddit";

const fixturesDir = resolve(__dirname, "../fixtures");

describe("post parser", () => {
  it("extracts title, body, and comments from shreddit fixture", () => {
    const html = readFileSync(resolve(fixturesDir, "post.html"), "utf8");
    const window = new Window();
    window.document.write(html);

    const post = parsePostPage(
      window.document as unknown as Document,
      "https://www.reddit.com/r/SaaS/comments/abc123/struggling_to_validate/",
    );

    expect(post.title).toContain("validate SaaS ideas");
    expect(post.body).toContain("lose context");
    expect(post.subreddit).toBe("SaaS");
    expect(post.author).toBe("founder123");
    expect(post.score).toBe(142);
    expect(post.comments).toHaveLength(2);
    expect(post.comments[0].body).toContain("spreadsheets");
  });
});

describe("subreddit parser", () => {
  it("extracts subreddit name and description", () => {
    const html = readFileSync(resolve(fixturesDir, "subreddit.html"), "utf8");
    const window = new Window();
    window.document.write(html);

    const info = parseSubredditPage(
      window.document as unknown as Document,
      "https://www.reddit.com/r/SaaS/",
    );

    expect(info.name).toBe("SaaS");
    expect(info.title).toContain("SaaS");
    expect(info.description).toContain("Software as a Service");
    expect(info.subscribers).toBe(128000);
  });
});
