import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BLUEPRINT_REQUIRED_SECTIONS,
  PHASE_PLAN_REQUIRED_SECTIONS,
  buildSamplePhase0Variables,
  renderBlueprint,
  renderPhasePlan,
  renderTemplate,
  validateSections,
} from "./engine";

const assetsDir = resolve(__dirname, "assets");

describe("template engine", () => {
  it("renders variables into template placeholders", () => {
    const output = renderTemplate("Hello {{name}}", { name: "Implemento" });
    expect(output).toBe("Hello Implemento");
  });

  it("renders sample phase 0 plan with all required sections", () => {
    const template = readFileSync(
      resolve(assetsDir, "phase-plan-template.md"),
      "utf8",
    );
    const output = renderPhasePlan(buildSamplePhase0Variables(), template);
    const result = validateSections(output, PHASE_PLAN_REQUIRED_SECTIONS);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(output).toContain("# Phase 0: Foundations");
  });

  it("renders blueprint with all required sections", () => {
    const template = readFileSync(
      resolve(assetsDir, "blueprint-template.md"),
      "utf8",
    );
    const output = renderBlueprint(
      {
        project_slug: "implemento",
        status: "draft",
        created: "2026-07-11",
        updated: "2026-07-11",
        project_title: "Implemento",
        executive_decision: "Build the extension.",
        evidence_method: "Repository audit.",
        intelligence_report: "Founder pain around fragmented workflows.",
        user_problem: "Solo founders researching on Reddit.",
        competitive_landscape: "Monitoring tools lack planning pipeline.",
        uvp: "Methodology-backed browser-native pipeline.",
        validation_experiments: "Time-to-first-export benchmark.",
        prd: "Capture, plan, draft.",
        mvp_scope: "Chrome MV3 side panel.",
        architecture: "Local-first extension.",
        interfaces: "Content script to background messages.",
        security: "Local storage only in v1.",
        delivery_map: "Phases 0-5.",
        gtm: "Ethical Reddit participation.",
        risks: "DOM breakage; API approval.",
        sources: "Public competitor pages.",
        handoff: "Create phase 0 plan.",
      },
      template,
    );
    const result = validateSections(output, BLUEPRINT_REQUIRED_SECTIONS);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });
});
