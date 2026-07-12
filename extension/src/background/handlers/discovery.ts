import { browserStorageAdapter } from "../../shared/storage/browser-storage";
import {
  buildDiscoverySystemPrompt,
  buildDiscoveryUserPrompt,
  buildJsonRepairPrompt,
  evidenceForDiscoveryRun,
} from "../../shared/discovery/prompt";
import {
  DiscoveryParseError,
  parseDiscoveryResponse,
} from "../../shared/discovery/parser";
import {
  createLlmAdapterForWorker,
} from "../../shared/llm/llm-adapter";
import type { CommunityProfileSuggestion, PainTheme } from "../../shared/types/domain";
import type { ImplementoResponse } from "../../shared/messages/types";

function ok<T>(data?: T): ImplementoResponse<T> {
  return { ok: true, data };
}

function fail(error: string): ImplementoResponse<never> {
  return { ok: false, error };
}

export interface DiscoveryResult {
  themes: PainTheme[];
  suggestions: CommunityProfileSuggestion[];
}

export interface DiscoveryRunOptions {
  researchQuery?: string;
  subreddits?: string[];
  runId?: string;
}

export async function runDiscoveryHandler(
  sessionId?: string,
  options: DiscoveryRunOptions = {},
): Promise<ImplementoResponse<DiscoveryResult>> {
  const resolvedSessionId =
    sessionId ?? (await browserStorageAdapter.getActiveSessionId());
  if (!resolvedSessionId) {
    return fail("Create or select a research session first.");
  }

  const sessions = await browserStorageAdapter.getSessions();
  const session = sessions.find((item) => item.id === resolvedSessionId);
  if (!session) return fail("Active session not found.");

  const evidence = evidenceForDiscoveryRun(
    await browserStorageAdapter.listEvidence(resolvedSessionId),
    options.runId,
  );
  if (evidence.length === 0) {
    return fail(
      options.runId
        ? "No evidence collected for this discovery run. Try a broader query or different subreddits."
        : "Pin at least one evidence item before running discovery.",
    );
  }

  const adapter = await createLlmAdapterForWorker(browserStorageAdapter);
  if (!adapter.isConfigured()) {
    return fail("Configure your LLM API settings before analyzing.");
  }

  await browserStorageAdapter.ensureSeedProfiles();
  const profiles = await browserStorageAdapter.listCommunityProfiles();
  const validEvidenceIds = new Set(evidence.map((item) => item.id));

  const system = buildDiscoverySystemPrompt();
  const user = buildDiscoveryUserPrompt({
    sessionName: session.name,
    researchQuery: options.researchQuery,
    subreddits: options.subreddits,
    evidence,
    profiles,
  });

  try {
    let content = (await adapter.complete({ system, user, temperature: 0.2 })).content;
    let parsed: DiscoveryResult;

    try {
      parsed = parseDiscoveryResponse(content, resolvedSessionId, validEvidenceIds);
    } catch (error) {
      if (!(error instanceof DiscoveryParseError)) throw error;
      const repair = await adapter.complete({
        system: "Return valid JSON only.",
        user: buildJsonRepairPrompt(content),
        temperature: 0,
      });
      content = repair.content;
      parsed = parseDiscoveryResponse(content, resolvedSessionId, validEvidenceIds);
    }

    await browserStorageAdapter.replacePainThemes(resolvedSessionId, parsed.themes);
    return ok(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery analysis failed.";
    return fail(message);
  }
}

export async function applyProfileSuggestionHandler(
  suggestion: CommunityProfileSuggestion,
): Promise<ImplementoResponse<void>> {
  const subreddit = suggestion.subreddit.replace(/^r\//i, "");
  const profiles = await browserStorageAdapter.listCommunityProfiles();
  const existing = profiles.find((item) => item.subreddit === subreddit);

  await browserStorageAdapter.upsertCommunityProfile({
    subreddit,
    tone: suggestion.tone ?? existing?.tone ?? "",
    postPatterns: suggestion.postPatterns ?? existing?.postPatterns ?? [],
    promoPolicy: suggestion.promoPolicy ?? existing?.promoPolicy ?? "",
    rulesNotes: suggestion.rulesNotes ?? existing?.rulesNotes ?? "",
  });

  return ok();
}
