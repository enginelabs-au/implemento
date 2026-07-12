import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDiscoveryResponse } from "./parser";

describe("discovery parser", () => {
  it("parses fixture JSON into pain themes", () => {
    const fixture = readFileSync(
      resolve(__dirname, "fixtures/sample-response.json"),
      "utf8",
    );
    const result = parseDiscoveryResponse(fixture, "session-1", new Set(["evidence-1"]));

    expect(result.themes).toHaveLength(1);
    expect(result.themes[0].title).toContain("fragmentation");
    expect(result.themes[0].severity).toBe(8);
    expect(result.themes[0].inferenceFlag).toBe(false);
    expect(result.themes[0].workaroundPhrases).toContain("spreadsheets");
    expect(result.suggestions).toHaveLength(1);
  });

  it("rejects themes without valid evidence ids", () => {
    const fixture = readFileSync(
      resolve(__dirname, "fixtures/sample-response.json"),
      "utf8",
    );
    expect(() =>
      parseDiscoveryResponse(fixture, "session-1", new Set(["missing-id"])),
    ).toThrow(/valid evidenceIds/i);
  });
});
