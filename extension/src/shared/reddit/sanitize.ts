/* eslint-disable no-control-regex -- strip unsafe control chars from Reddit text */
const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;

export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(CONTROL_CHAR_REGEX, "")
    .replace(ZERO_WIDTH_REGEX, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeQuote(quote: string): string {
  return sanitizeText(quote).toLowerCase().replace(/\s+/g, " ").trim();
}

export function evidenceDedupeKey(
  sessionId: string,
  redditUrl: string,
  quote: string,
): string {
  return `${sessionId}|${redditUrl}|${normalizeQuote(quote)}`;
}
