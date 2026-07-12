import { sanitizeText } from "../sanitize";

export function textOf(element: Element | null | undefined): string {
  if (!element) return "";
  return sanitizeText(element.textContent ?? "");
}

export function attrOf(element: Element | null | undefined, name: string): string {
  if (!element) return "";
  return sanitizeText(element.getAttribute(name) ?? "");
}

export function parseScore(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned || cleaned === "•" || cleaned === "Vote") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function firstText(
  root: ParentNode,
  selectors: string[],
): string {
  for (const selector of selectors) {
    const el = root.querySelector(selector);
    const value = textOf(el);
    if (value) return value;
  }
  return "";
}
