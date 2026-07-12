import type { ParsedSubreddit } from "../types";
import { attrOf, firstText } from "./utils";

export function parseSubredditPage(doc: Document, url: string): ParsedSubreddit {
  const name =
    attrOf(doc.querySelector("shreddit-subreddit-header"), "name") ||
    attrOf(doc.querySelector("shreddit-subreddit-header"), "prefixed-name")?.replace(
      /^r\//i,
      "",
    ) ||
    extractSubredditFromUrl(url);

  const title =
    firstText(doc, [
      "shreddit-subreddit-header h1",
      "[data-testid='subreddit-name']",
      "h1",
    ]) || (name ? `r/${name}` : "");

  const description = firstText(doc, [
    "shreddit-subreddit-header p",
    "[data-testid='subreddit-description']",
    "#description",
    "meta[name='description']",
  ]);

  const subscribersRaw = firstText(doc, [
    "shreddit-subreddit-header [slot='members-count']",
    "[data-testid='subreddit-members-count']",
  ]);
  const subscribers = parseSubscribers(subscribersRaw);

  return {
    name,
    title,
    description,
    subscribers,
  };
}

function extractSubredditFromUrl(url: string): string {
  const match = url.match(/\/r\/([^/]+)/i);
  return match?.[1] ?? "";
}

function parseSubscribers(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.toLowerCase().replace(/members?|subscribers?|,/g, "").trim();
  const million = normalized.match(/([\d.]+)\s*m/);
  if (million) return Math.round(parseFloat(million[1]) * 1_000_000);
  const thousand = normalized.match(/([\d.]+)\s*k/);
  if (thousand) return Math.round(parseFloat(thousand[1]) * 1_000);
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
