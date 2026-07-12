import type { ParsedProfile } from "../types";
import { firstText } from "./utils";

export function parseProfilePage(doc: Document, url: string): ParsedProfile {
  const username =
    extractUsernameFromUrl(url) ||
    firstText(doc, ["h1", "[data-testid='profile-username']"]);

  const karmaRaw = firstText(doc, [
    "[data-testid='karma-value']",
    "#profile--id-card--highlight-tooltip--karma",
  ]);
  const karma = parseKarma(karmaRaw);

  return {
    username: username.replace(/^u\//i, ""),
    karma,
  };
}

function extractUsernameFromUrl(url: string): string {
  const match = url.match(/\/(?:user|u)\/([^/]+)/i);
  return match?.[1] ?? "";
}

function parseKarma(raw: string): number | null {
  if (!raw) return null;
  const value = Number(raw.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}
