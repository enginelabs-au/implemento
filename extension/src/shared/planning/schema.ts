export const BLUEPRINT_VARIABLE_KEYS = [
  "project_slug",
  "project_title",
  "executive_decision",
  "evidence_method",
  "intelligence_report",
  "user_problem",
  "competitive_landscape",
  "uvp",
  "validation_experiments",
  "prd",
  "mvp_scope",
  "architecture",
  "interfaces",
  "security",
  "delivery_map",
  "gtm",
  "risks",
  "sources",
  "handoff",
] as const;

export type BlueprintVariableKey = (typeof BLUEPRINT_VARIABLE_KEYS)[number];

export type BlueprintVariablesPayload = Record<BlueprintVariableKey, string>;

export const PHASE0_VARIABLE_KEYS = [
  "phase_title",
  "objective",
  "relation",
  "entry_criteria",
  "scope",
  "non_goals",
  "audit",
  "assumptions",
  "dependencies",
  "architecture",
  "files",
  "supporting_docs",
  "tasks",
  "delegation",
  "validation_rows",
  "security",
  "env_rows",
  "deferred_rows",
  "rollback",
  "acceptance",
  "completion",
  "deviations",
  "next_plan_prompt",
] as const;

export type Phase0VariableKey = (typeof PHASE0_VARIABLE_KEYS)[number];

export type Phase0VariablesPayload = Record<Phase0VariableKey, string>;

const MAX_FIELD_LENGTH = 12000;

export function normalizeProjectSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function readStringField(
  record: Record<string, unknown>,
  key: string,
  label: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} missing or empty.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_FIELD_LENGTH) {
    return `${trimmed.slice(0, MAX_FIELD_LENGTH)}…`;
  }
  return trimmed;
}

export function parseBlueprintVariablesRecord(
  record: Record<string, unknown>,
): BlueprintVariablesPayload {
  const parsed = {} as BlueprintVariablesPayload;
  for (const key of BLUEPRINT_VARIABLE_KEYS) {
    parsed[key] = readStringField(record, key, key);
  }
  parsed.project_slug = normalizeProjectSlug(parsed.project_slug || parsed.project_title);
  return parsed;
}

export function parsePhase0VariablesRecord(
  record: Record<string, unknown>,
): Phase0VariablesPayload {
  const parsed = {} as Phase0VariablesPayload;
  for (const key of PHASE0_VARIABLE_KEYS) {
    parsed[key] = readStringField(record, key, key);
  }
  return parsed;
}
