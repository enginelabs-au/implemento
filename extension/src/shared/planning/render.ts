import {
  BLUEPRINT_REQUIRED_SECTIONS,
  PHASE_PLAN_REQUIRED_SECTIONS,
  renderBlueprint,
  renderPhasePlan,
  validateSections,
  type SectionValidationResult,
} from "../templates/engine";
import type { BlueprintVariablesPayload, Phase0VariablesPayload } from "./schema";
import { normalizeProjectSlug } from "./schema";

export interface RenderedArtifact {
  markdown: string;
  validation: SectionValidationResult;
}

export function blueprintVariablesToTemplateVars(
  vars: BlueprintVariablesPayload,
  overrides?: { status?: string; created?: string; updated?: string },
): Record<string, string> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    status: overrides?.status ?? "draft",
    created: overrides?.created ?? today,
    updated: overrides?.updated ?? today,
    project_slug: normalizeProjectSlug(vars.project_slug),
    project_title: vars.project_title,
    executive_decision: vars.executive_decision,
    evidence_method: vars.evidence_method,
    intelligence_report: vars.intelligence_report,
    user_problem: vars.user_problem,
    competitive_landscape: vars.competitive_landscape,
    uvp: vars.uvp,
    validation_experiments: vars.validation_experiments,
    prd: vars.prd,
    mvp_scope: vars.mvp_scope,
    architecture: vars.architecture,
    interfaces: vars.interfaces,
    security: vars.security,
    delivery_map: vars.delivery_map,
    gtm: vars.gtm,
    risks: vars.risks,
    sources: vars.sources,
    handoff: vars.handoff,
  };
}

export function phase0VariablesToTemplateVars(
  vars: Phase0VariablesPayload,
  overrides?: {
    status?: string;
    created?: string;
    updated?: string;
    source_phase?: string;
  },
): Record<string, string> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    status: overrides?.status ?? "draft",
    created: overrides?.created ?? today,
    updated: overrides?.updated ?? today,
    source_phase: overrides?.source_phase ?? "session blueprint",
    phase_number: "0",
    phase_title: vars.phase_title,
    objective: vars.objective,
    relation: vars.relation,
    entry_criteria: vars.entry_criteria,
    scope: vars.scope,
    non_goals: vars.non_goals,
    audit: vars.audit,
    assumptions: vars.assumptions,
    dependencies: vars.dependencies,
    architecture: vars.architecture,
    files: vars.files,
    supporting_docs: vars.supporting_docs,
    tasks: vars.tasks,
    delegation: vars.delegation,
    validation_rows: vars.validation_rows,
    security: vars.security,
    env_rows: vars.env_rows,
    deferred_rows: vars.deferred_rows,
    rollback: vars.rollback,
    acceptance: vars.acceptance,
    completion: vars.completion,
    deviations: vars.deviations,
    next_plan_prompt: vars.next_plan_prompt,
  };
}

export function renderBlueprintFromVariables(
  vars: BlueprintVariablesPayload,
  overrides?: { status?: string; created?: string; updated?: string },
): RenderedArtifact {
  const markdown = renderBlueprint(blueprintVariablesToTemplateVars(vars, overrides));
  const validation = validateSections(markdown, BLUEPRINT_REQUIRED_SECTIONS);
  return { markdown, validation };
}

export function renderPhase0FromVariables(
  vars: Phase0VariablesPayload,
  overrides?: {
    status?: string;
    created?: string;
    updated?: string;
    source_phase?: string;
  },
): RenderedArtifact {
  const markdown = renderPhasePlan(phase0VariablesToTemplateVars(vars, overrides));
  const validation = validateSections(markdown, PHASE_PLAN_REQUIRED_SECTIONS);
  return { markdown, validation };
}

export function buildSectionRepairPrompt(
  artifactType: "blueprint" | "phase0",
  invalidOutput: string,
  missingSections: string[],
): string {
  const sections = missingSections.join(", ");
  return [
    `Fix this ${artifactType} JSON so rendered markdown includes these missing sections: ${sections}.`,
    "Return JSON only with all required string fields populated.",
    "",
    invalidOutput,
  ].join("\n");
}
