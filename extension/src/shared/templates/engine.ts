import phasePlanTemplate from "./assets/phase-plan-template.md?raw";
import blueprintTemplate from "./assets/blueprint-template.md?raw";
import postDraftTemplate from "./assets/post-draft-template.md?raw";

export const PHASE_PLAN_REQUIRED_SECTIONS = [
  "## 1. Objective",
  "## 2. Relation to project end-state",
  "## 3. Entry criteria and inherited evidence",
  "## 4. Scope",
  "## 5. Non-goals",
  "## 6. Current-state audit",
  "## 7. Assumptions, constraints, risks, and decisions",
  "## 8. Dependencies",
  "## 9. Architecture and affected systems",
  "## 10. Files and paths in scope",
  "## 11. Supporting documents to create or update",
  "## 12. Ordered implementation tasks",
  "## 13. Sub-agent delegation map",
  "## 14. Test and validation matrix",
  "## 15. Security, privacy, reliability, accessibility, and performance checks",
  "## 16. Environment-variable registry",
  "## 17. Deferred human-action queue",
  "## 18. Rollback and recovery",
  "## 19. Acceptance criteria",
  "## 20. Completion evidence",
  "## 21. Deviations and follow-ups",
  "## 22. Next Plan Generation Prompt",
] as const;

export const BLUEPRINT_REQUIRED_SECTIONS = [
  "## 1. Executive decision",
  "## 2. Evidence and research method",
  "## 3. Intelligence report",
  "## 4. User/problem definition",
  "## 5. Competitive landscape and gap",
  "## 6. Unique value proposition and wedge",
  "## 7. Validation experiments and thresholds",
  "## 8. Product requirements document",
  "## 9. MVP scope and non-goals",
  "## 10. System architecture and data model",
  "## 11. Interfaces and integrations",
  "## 12. Security, privacy, reliability, and compliance considerations",
  "## 13. Delivery phase map",
  "## 14. Cultural go-to-market strategy",
  "## 15. Risks, pivots, and no-build criteria",
  "## 16. Sources and research limitations",
  "## 17. Handoff into phase_0_foundations_plan.md",
] as const;

export interface SectionValidationResult {
  valid: boolean;
  missing: string[];
}

export function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return Object.prototype.hasOwnProperty.call(variables, key)
      ? variables[key]
      : "";
  });
}

export function validateSections(
  markdown: string,
  requiredSections: readonly string[],
): SectionValidationResult {
  const missing = requiredSections.filter(
    (section) => !markdown.includes(section),
  );
  return {
    valid: missing.length === 0,
    missing: [...missing],
  };
}

export interface SamplePhase0Variables {
  status?: string;
  created?: string;
  updated?: string;
  source_phase?: string;
  phase_number?: string;
  phase_title?: string;
  objective?: string;
}

export function buildSamplePhase0Variables(
  overrides: SamplePhase0Variables = {},
): Record<string, string> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    status: "draft",
    created: today,
    updated: today,
    source_phase: "none",
    phase_number: "0",
    phase_title: "Foundations",
    objective:
      "Establish the Implemento browser extension foundation: MV3 scaffold, template engine, and control-plane alignment.",
    relation:
      "Creates the skeleton for Reddit capture, discovery, planning, and post suggestion phases.",
    entry_criteria:
      "Strategy blueprint complete; bootstrap docs structure present.",
    scope: "Extension scaffold, domain types, template engine, sample export.",
    non_goals: "Reddit capture, live LLM calls, Chrome Web Store publication.",
    audit: "Greenfield repository with agent control plane at `.cursor/`.",
    assumptions:
      "Chrome MV3, local-first storage, user-supplied LLM key in phase 2+.",
    dependencies: "Node.js 20+, Chrome for manual extension testing.",
    architecture:
      "MV3 extension: service worker, side panel, shared modules under `extension/src/shared/`.",
    files: "`extension/`, `docs/decisions/`, root workspace tooling.",
    supporting_docs: "`docs/decisions/0001-extension-stack.md`, README.",
    tasks: "See phase 0 ordered implementation tasks in the active plan.",
    delegation: "Lead agent owns integration; sub-agents optional for slices.",
    validation_rows:
      "| Template export | Unit test | All required headings present | pending |",
    security:
      "Local-first storage; no network calls in phase 0; MV3 CSP defaults.",
    env_rows:
      "| IMPLEMENTO_LLM_API_KEY | LLM auth | User storage | phase 2 | User | not_required_yet |",
    deferred_rows:
      "| Reddit API app | User account + approval | phase 5 | No | OAuth section |",
    rollback: "Delete `extension/` and revert workspace tooling if needed.",
    acceptance:
      "Build passes; extension loads; sample phase 0 export contains all sections.",
    completion: "_Pending phase 0 implementation._",
    deviations: "_None yet._",
    next_plan_prompt:
      "Generate `docs/plans/phase_1_reddit-capture_plan.md` after phase 0 is verified.",
    ...overrides,
  };
}

export function renderPhasePlan(
  variables: Record<string, string>,
  template: string = phasePlanTemplate,
): string {
  return renderTemplate(template, variables);
}

export function renderBlueprint(
  variables: Record<string, string>,
  template: string = blueprintTemplate,
): string {
  return renderTemplate(template, variables);
}

export function renderPostDraft(
  variables: Record<string, string>,
  template: string = postDraftTemplate,
): string {
  return renderTemplate(template, variables);
}

export function renderSamplePhase0Plan(): string {
  return renderPhasePlan(buildSamplePhase0Variables());
}
