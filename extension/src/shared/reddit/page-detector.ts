import type { PageType } from "./types";

export function detectPageTypeFromUrl(url: string): PageType {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("reddit.com")) return "unknown";

    const path = parsed.pathname;

    if (/\/r\/[^/]+\/comments\/[^/]+/.test(path)) return "post";
    if (path === "/search/" || path.startsWith("/search/") || parsed.searchParams.has("q")) {
      return "search";
    }
    if (/^\/user\/[^/]+\/?$/.test(path) || /^\/u\/[^/]+\/?$/.test(path)) {
      return "profile";
    }
    if (/^\/r\/[^/]+\/?$/.test(path)) return "subreddit";

    return "unknown";
  } catch {
    return "unknown";
  }
}

export function extractSubredditFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/r\/([^/]+)/i);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}
