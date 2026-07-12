import { describe, expect, it } from "vitest";
import { sanitizeText, normalizeQuote, evidenceDedupeKey } from "./sanitize";

describe("sanitize", () => {
  it("strips control characters and zero-width spaces", () => {
    const input = "Hello\u200B\u0007world";
    expect(sanitizeText(input)).toBe("Helloworld");
  });

  it("normalizes whitespace in quotes", () => {
    expect(normalizeQuote("  Hello   world \n\n")).toBe("hello world");
  });

  it("dedupes equivalent quotes", () => {
    const a = evidenceDedupeKey("s1", "https://reddit.com/x", "Same Quote");
    const b = evidenceDedupeKey("s1", "https://reddit.com/x", "same   quote");
    expect(a).toBe(b);
  });

  it("strips html tags from pasted content", () => {
    expect(sanitizeText("<b>safe</b>")).toBe("safe");
  });
});
