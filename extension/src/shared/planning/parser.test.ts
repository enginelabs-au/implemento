import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBlueprintVariablesResponse, parsePhase0VariablesResponse } from "./parser";
import { renderBlueprintFromVariables, renderPhase0FromVariables } from "./render";
import { normalizeProjectSlug } from "./schema";

describe("planning parser", () => {
  it("parses blueprint fixture JSON", () => {
    const fixture = readFileSync(
      resolve(__dirname, "fixtures/sample-blueprint-response.json"),
      "utf8",
    );
    const vars = parseBlueprintVariablesResponse(fixture);
    expect(vars.project_title).toContain("Reddit Workflow");
    const rendered = renderBlueprintFromVariables(vars);
    expect(rendered.validation.valid).toBe(true);
  });

  it("parses phase 0 fixture JSON", () => {
    const fixture = readFileSync(
      resolve(__dirname, "fixtures/sample-phase0-response.json"),
      "utf8",
    );
    const vars = parsePhase0VariablesResponse(fixture);
    expect(vars.phase_title).toBe("Foundations");
    const rendered = renderPhase0FromVariables(vars);
    expect(rendered.validation.valid).toBe(true);
  });

  it("normalizes project slug", () => {
    expect(normalizeProjectSlug("My Cool Product!")).toBe("my-cool-product");
  });
});
