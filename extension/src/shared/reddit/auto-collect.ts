import type { EvidenceItem } from "../types/domain";
import {
  isPostPageContext,
  isSearchPageContext,
  isSubredditPageContext,
  type PageContext,
  type ParsedFeedPost,
} from "./types";

export interface CollectibleEvidence {
  redditUrl: string;
  subreddit: string;
  quote: string;
  type: EvidenceItem["type"];
  tags: string[];
}

export interface AutoCollectInput {
  query?: string;
  subreddits?: string[];
}

export interface AutoCollectPlan {
  urls: string[];
  query?: string;
  subreddits: string[];
}

const MAX_DEEP_POSTS_PER_SOURCE = 3;

export function buildAutoCollectPlan(input: AutoCollectInput): AutoCollectPlan {
  const query = input.query?.trim();
  const subreddits = (input.subreddits ?? [])
    .map((name) => name.replace(/^r\//i, "").trim())
    .filter(Boolean);

  const urls: string[] = [];
  if (query) {
    urls.push(`https://www.reddit.com/search/?q=${encodeURIComponent(query)}`);
  }
  for (const subreddit of subreddits) {
    urls.push(`https://www.reddit.com/r/${subreddit}/`);
  }

  return { urls, query, subreddits };
}

export function evidenceFromSearchResults(
  sessionId: string,
  context: PageContext,
): CollectibleEvidence[] {
  if (!isSearchPageContext(context)) return [];

  return context.search.results
    .filter((result) => result.permalink && result.title)
    .map((result) => ({
      redditUrl: result.permalink,
      subreddit: result.subreddit.replace(/^r\//i, ""),
      quote: [result.title, result.snippet].filter(Boolean).join("\n\n"),
      type: "search_result" as const,
      tags: ["auto-collect", "search"],
    }));
}

export function evidenceFromFeedPosts(
  sessionId: string,
  context: PageContext,
): CollectibleEvidence[] {
  if (!isSubredditPageContext(context)) return [];

  return context.feedPosts
    .filter((post) => post.permalink && post.title)
    .map((post) => ({
      redditUrl: post.permalink,
      subreddit: post.subreddit.replace(/^r\//i, ""),
      quote: [post.title, post.snippet].filter(Boolean).join("\n\n"),
      type: "search_result" as const,
      tags: ["auto-collect", "feed"],
    }));
}

export function evidenceFromPostPage(context: PageContext): CollectibleEvidence[] {
  if (!isPostPageContext(context)) return [];

  const items: CollectibleEvidence[] = [];
  const postQuote = [context.post.title, context.post.body].filter(Boolean).join("\n\n");
  if (postQuote) {
    items.push({
      redditUrl: context.post.permalink || context.url,
      subreddit: context.post.subreddit || context.subreddit,
      quote: postQuote,
      type: "post",
      tags: ["auto-collect", "post"],
    });
  }

  for (const comment of context.post.comments.slice(0, 10)) {
    if (!comment.body) continue;
    items.push({
      redditUrl: comment.permalink || context.post.permalink || context.url,
      subreddit: context.post.subreddit || context.subreddit,
      quote: comment.body,
      type: "comment",
      tags: ["auto-collect", "comment", `author:${comment.author}`],
    });
  }

  return items;
}

export function deepPostUrlsFromContext(context: PageContext): string[] {
  if (isSearchPageContext(context)) {
    return context.search.results
      .map((result) => result.permalink)
      .filter(Boolean)
      .slice(0, MAX_DEEP_POSTS_PER_SOURCE);
  }

  if (isSubredditPageContext(context)) {
    return context.feedPosts
      .map((post: ParsedFeedPost) => post.permalink)
      .filter(Boolean)
      .slice(0, MAX_DEEP_POSTS_PER_SOURCE);
  }

  return [];
}

export function evidenceFromPageContext(context: PageContext): CollectibleEvidence[] {
  return [
    ...evidenceFromSearchResults("", context),
    ...evidenceFromFeedPosts("", context),
    ...evidenceFromPostPage(context),
  ];
}
