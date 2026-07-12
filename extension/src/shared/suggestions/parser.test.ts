import { describe, expect, it } from "vitest";
import { buildSuggestionUserPrompt } from "./prompt";
import { parseSuggestionResponse, SuggestionParseError } from "./parser";

describe("suggestion prompt", () => {
  it("includes field type and variation seed", () => {
    const prompt = buildSuggestionUserPrompt({
      fieldType: "discovery_subreddits",
      variationSeed: "seed-123",
      currentValue: "SaaS",
    });
    expect(prompt).toContain("discovery_subreddits");
    expect(prompt).toContain("seed-123");
    expect(prompt).toContain("SaaS");
  });
});

describe("suggestion parser", () => {
  it("parses json value", () => {
    expect(parseSuggestionResponse('{"value": "SaaS, startups, entrepreneur"}')).toEqual({
      value: "SaaS, startups, entrepreneur",
    });
  });

  it("rejects missing value", () => {
    expect(() => parseSuggestionResponse('{"text": "nope"}')).toThrow(SuggestionParseError);
  });
});
