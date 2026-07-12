import type { ParsedSearch } from "../types";
import { firstText, textOf } from "./utils";

export function parseSearchPage(doc: Document, url: string): ParsedSearch {
  const parsedUrl = new URL(url);
  const query =
    parsedUrl.searchParams.get("q") ||
    firstText(doc, ["input[name='q']", "faceplate-search-input"]) ||
    "";

  const resultEls = Array.from(
    doc.querySelectorAll(
      "search-telemetry-tracker h2 a, shreddit-post, [data-testid='search-post-unit']",
    ),
  ).slice(0, 10);

  const results = resultEls.map((el) => {
    const anchor = el instanceof HTMLAnchorElement ? el : el.querySelector("a");
    const title = textOf(anchor) || textOf(el.querySelector("h2, h3"));
    const href = anchor?.getAttribute("href") ?? "";
    const permalink = href.startsWith("http")
      ? href
      : href
        ? `https://www.reddit.com${href}`
        : "";
    const subredditMatch = permalink.match(/\/r\/([^/]+)/i);
    const snippet = textOf(
      el.closest("article")?.querySelector("p") ?? el.querySelector("p"),
    );

    return {
      title: title || "(result)",
      subreddit: subredditMatch?.[1] ?? "",
      snippet,
      permalink,
    };
  });

  return { query, results };
}
