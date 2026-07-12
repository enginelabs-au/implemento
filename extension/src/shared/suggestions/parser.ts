import type { SuggestFieldResponse } from "./types";

export class SuggestionParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SuggestionParseError";
  }
}

export function parseSuggestionResponse(content: string): SuggestFieldResponse {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new SuggestionParseError("LLM response did not contain JSON.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new SuggestionParseError("LLM returned invalid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || !("value" in parsed)) {
    throw new SuggestionParseError('JSON must include a "value" field.');
  }

  const value = (parsed as { value: unknown }).value;
  if (typeof value !== "string" || !value.trim()) {
    throw new SuggestionParseError('"value" must be a non-empty string.');
  }

  return { value: value.trim() };
}
