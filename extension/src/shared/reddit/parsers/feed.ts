import type { ParsedFeedPost } from "../types";
import { attrOf, firstText, parseScore, textOf } from "./utils";

const MAX_FEED_POSTS = 12;

export function parseSubredditFeed(
  doc: Document,
  url: string,
  max = MAX_FEED_POSTS,
): ParsedFeedPost[] {
  const fallbackSubreddit = extractSubredditFromUrl(url);
  const postEls = Array.from(doc.querySelectorAll("shreddit-post")).slice(0, max);

  return postEls
    .map((el, index) => {
      const title =
        attrOf(el, "post-title") ||
        textOf(el.querySelector("a[slot='title'], h3, [slot='title']"));
      const subreddit =
        attrOf(el, "subreddit-prefixed-name").replace(/^r\//i, "") ||
        fallbackSubreddit;
      const permalink = normalizePermalink(attrOf(el, "permalink"));
      const snippet = firstText(el, [
        "shreddit-post-text-body",
        "[slot='text-body']",
        "p",
      ]);
      const score = parseScore(attrOf(el, "score"));
      const id =
        attrOf(el, "id") ||
        permalink.match(/comments\/([^/]+)/)?.[1] ||
        `feed-${index}`;

      return {
        id,
        title: title || "(untitled)",
        snippet,
        subreddit,
        permalink,
        score,
      } satisfies ParsedFeedPost;
    })
    .filter((post) => post.title && post.permalink);
}

function extractSubredditFromUrl(url: string): string {
  const match = url.match(/\/r\/([^/]+)/i);
  return match?.[1] ?? "";
}

function normalizePermalink(permalink: string): string {
  if (!permalink) return "";
  if (permalink.startsWith("http")) return permalink;
  return `https://www.reddit.com${permalink.startsWith("/") ? "" : "/"}${permalink}`;
}
