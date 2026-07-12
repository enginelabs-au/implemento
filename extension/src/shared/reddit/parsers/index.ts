import {
  detectPageTypeFromUrl,
  extractSubredditFromUrl,
} from "../page-detector";
import type { PageContext } from "../types";
import { parsePostPage } from "./post";
import { parseProfilePage } from "./profile";
import { parseSearchPage } from "./search";
import { parseSubredditPage } from "./subreddit";

export function parsePageContext(doc: Document, url: string): PageContext {
  const pageType = detectPageTypeFromUrl(url);
  const subreddit = extractSubredditFromUrl(url);
  const capturedAt = new Date().toISOString();
  const warnings: string[] = [];

  const base = { url, subreddit, capturedAt, warnings };

  switch (pageType) {
    case "post":
      return {
        ...base,
        pageType,
        post: parsePostPage(doc, url),
      };
    case "subreddit": {
      const subredditInfo = parseSubredditPage(doc, url);
      return {
        ...base,
        pageType,
        subreddit: subredditInfo.name || subreddit,
        subredditInfo,
      };
    }
    case "search":
      return {
        ...base,
        pageType,
        search: parseSearchPage(doc, url),
      };
    case "profile": {
      const profile = parseProfilePage(doc, url);
      return {
        ...base,
        pageType,
        profile,
      };
    }
    default:
      warnings.push("unsupported_page_type");
      return {
        ...base,
        pageType: "unknown",
      };
  }
}

export { parsePostPage, parseSubredditPage, parseSearchPage, parseProfilePage };
