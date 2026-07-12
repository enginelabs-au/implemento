import {
  parseBlueprintVariablesRecord,
  parsePhase0VariablesRecord,
  type BlueprintVariablesPayload,
  type Phase0VariablesPayload,
} from "./schema";

export class PlanningParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanningParseError";
  }
}

function extractJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new PlanningParseError("LLM response did not contain JSON.");
  }
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new PlanningParseError("LLM response JSON must be an object.");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof PlanningParseError) throw error;
    throw new PlanningParseError("LLM response JSON is invalid.");
  }
}

export function parseBlueprintVariablesResponse(raw: string): BlueprintVariablesPayload {
  const record = extractJsonObject(raw);
  try {
    return parseBlueprintVariablesRecord(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid blueprint variables.";
    throw new PlanningParseError(message);
  }
}

export function parsePhase0VariablesResponse(raw: string): Phase0VariablesPayload {
  const record = extractJsonObject(raw);
  try {
    return parsePhase0VariablesRecord(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid phase 0 variables.";
    throw new PlanningParseError(message);
  }
}
