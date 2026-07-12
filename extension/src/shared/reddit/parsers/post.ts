import type { ParsedPost, ParsedComment } from "../types";
import { attrOf, firstText, parseScore, textOf } from "./utils";

const MAX_COMMENTS = 20;

export function parsePostPage(doc: Document, url: string): ParsedPost {
  const warnings: string[] = [];
  const postEl =
    doc.querySelector("shreddit-post") ??
    doc.querySelector("[data-test-id='post-content']")?.closest("article") ??
    doc.querySelector("article");

  const subreddit =
    attrOf(doc.querySelector("shreddit-post"), "subreddit-prefixed-name").replace(
      /^r\//i,
      "",
    ) ||
    extractSubredditFromPath(url);

  const title =
    attrOf(doc.querySelector("shreddit-post"), "post-title") ||
    firstText(doc, ["h1", "shreddit-post [slot='title']", "[data-test-id='post-content'] h1"]);

  const body = firstText(doc, [
    "shreddit-post-text-body",
    "[data-test-id='post-content'] div[data-click-id='text']",
    "div[property='schema:articleBody']",
    "[slot='text-body']",
  ]);

  const author =
    attrOf(doc.querySelector("shreddit-post"), "author") ||
    firstText(doc, ["a[data-testid='post_author_link']", "a.author"]);

  const score = parseScore(
    attrOf(doc.querySelector("shreddit-post"), "score") ||
      firstText(doc, ["faceplate-number", "[id^='vote-arrows'] + div"]),
  );

  const flair = firstText(doc, [
    "shreddit-post flair-text",
    "[data-testid='post_flair']",
    "flair-text",
  ]);

  const permalink = normalizePermalink(
    attrOf(doc.querySelector("shreddit-post"), "permalink") || url,
  );

  const id =
    attrOf(doc.querySelector("shreddit-post"), "id") ||
    permalink.match(/comments\/([^/]+)/)?.[1] ||
    crypto.randomUUID();

  if (!title) warnings.push("title_not_found");
  if (!body) warnings.push("body_not_found");

  const comments = parseVisibleComments(doc, warnings);

  if (warnings.length > 0 && postEl === null) {
    warnings.push("post_element_not_found");
  }

  return {
    id,
    title: title || "(untitled post)",
    body,
    author: author || "unknown",
    score,
    flair,
    permalink,
    subreddit,
    comments,
  };
}

function parseVisibleComments(doc: Document, warnings: string[]): ParsedComment[] {
  const commentEls = Array.from(
    doc.querySelectorAll("shreddit-comment, [data-testid='comment']"),
  ).slice(0, MAX_COMMENTS);

  if (commentEls.length === 0) {
    warnings.push("no_comments_found");
    return [];
  }

  return commentEls
    .map((el, index) => {
      const author =
        attrOf(el, "author") ||
        textOf(el.querySelector("a[href*='/user/'], a.author"));
      const body = firstText(el, [
        "[slot='comment']",
        "div[data-testid='comment']",
        ".md",
        "p",
      ]);
      const score = parseScore(attrOf(el, "score"));
      const thingId = attrOf(el, "thingid") || attrOf(el, "id") || `comment-${index}`;
      const permalink = attrOf(el, "permalink") || "";

      return {
        id: thingId,
        author: author || "unknown",
        body,
        score,
        permalink,
      } satisfies ParsedComment;
    })
    .filter((comment) => comment.body.length > 0);
}

function extractSubredditFromPath(url: string): string {
  const match = url.match(/\/r\/([^/]+)/i);
  return match?.[1] ?? "";
}

function normalizePermalink(permalink: string): string {
  if (!permalink) return "";
  if (permalink.startsWith("http")) return permalink;
  return `https://www.reddit.com${permalink.startsWith("/") ? "" : "/"}${permalink}`;
}

export function supplementPostFromJson(
  post: ParsedPost,
  json: RedditListingResponse,
): ParsedPost {
  const listing = json?.[0]?.data?.children?.[0]?.data;
  if (!listing) return post;

  return {
    ...post,
    title: post.title || listing.title || post.title,
    body: post.body || listing.selftext || "",
    author: post.author === "unknown" ? listing.author || post.author : post.author,
    score: post.score ?? listing.score ?? null,
    flair: post.flair || listing.link_flair_text || "",
    subreddit: post.subreddit || listing.subreddit || "",
  };
}

export interface RedditListingChild {
  data?: {
    title?: string;
    selftext?: string;
    author?: string;
    score?: number;
    link_flair_text?: string;
    subreddit?: string;
  };
}

export type RedditListingResponse = [
  { data?: { children?: RedditListingChild[] } },
  ...unknown[],
];
