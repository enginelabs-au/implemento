export type PageType = "subreddit" | "post" | "search" | "profile" | "unknown";

export interface ParsedComment {
  id: string;
  author: string;
  body: string;
  score: number | null;
  permalink: string;
}

export interface ParsedPost {
  id: string;
  title: string;
  body: string;
  author: string;
  score: number | null;
  flair: string;
  permalink: string;
  subreddit: string;
  comments: ParsedComment[];
}

export interface ParsedSubreddit {
  name: string;
  title: string;
  description: string;
  subscribers: number | null;
}

export interface ParsedSearch {
  query: string;
  results: Array<{
    title: string;
    subreddit: string;
    snippet: string;
    permalink: string;
  }>;
}

export interface ParsedProfile {
  username: string;
  karma: number | null;
}

export interface PageContextBase {
  pageType: PageType;
  url: string;
  subreddit: string;
  capturedAt: string;
  warnings: string[];
}

export type PageContext =
  | (PageContextBase & { pageType: "post"; post: ParsedPost })
  | (PageContextBase & { pageType: "subreddit"; subredditInfo: ParsedSubreddit })
  | (PageContextBase & { pageType: "search"; search: ParsedSearch })
  | (PageContextBase & { pageType: "profile"; profile: ParsedProfile })
  | PageContextBase;

export function isPostPageContext(
  context: PageContext | null | undefined,
): context is PageContextBase & { pageType: "post"; post: ParsedPost } {
  return Boolean(context && context.pageType === "post" && "post" in context);
}

export function isSubredditPageContext(
  context: PageContext | null | undefined,
): context is PageContextBase & { pageType: "subreddit"; subredditInfo: ParsedSubreddit } {
  return Boolean(
    context && context.pageType === "subreddit" && "subredditInfo" in context,
  );
}

export function isSearchPageContext(
  context: PageContext | null | undefined,
): context is PageContextBase & { pageType: "search"; search: ParsedSearch } {
  return Boolean(context && context.pageType === "search" && "search" in context);
}

export function isProfilePageContext(
  context: PageContext | null | undefined,
): context is PageContextBase & { pageType: "profile"; profile: ParsedProfile } {
  return Boolean(context && context.pageType === "profile" && "profile" in context);
}
