import { browserStorageAdapter } from "../../shared/storage/browser-storage";
import {
  buildBlueprintSystemPrompt,
  buildBlueprintUserPrompt,
  buildJsonRepairPrompt,
  buildPhase0SystemPrompt,
  buildPhase0UserPrompt,
} from "../../shared/planning/prompt";
import {
  PlanningParseError,
  parseBlueprintVariablesResponse,
  parsePhase0VariablesResponse,
} from "../../shared/planning/parser";
import {
  buildSectionRepairPrompt,
  renderBlueprintFromVariables,
  renderPhase0FromVariables,
} from "../../shared/planning/render";
import {
  createLlmAdapter,
  settingsFromStorage,
} from "../../shared/llm/llm-adapter";
import type { Blueprint, PhasePlan, PhasePlanStatus, ResearchSession } from "../../shared/types/domain";
import type { ImplementoResponse } from "../../shared/messages/types";

function ok<T>(data?: T): ImplementoResponse<T> {
  return { ok: true, data };
}

function fail(error: string): ImplementoResponse<never> {
  return { ok: false, error };
}

async function resolveSession(
  sessionId?: string,
): Promise<
  | { ok: true; session: ResearchSession; sessionId: string }
  | { ok: false; error: string }
> {
  const resolvedSessionId =
    sessionId ?? (await browserStorageAdapter.getActiveSessionId());
  if (!resolvedSessionId) {
    return { ok: false, error: "Create or select a research session first." };
  }

  const sessions = await browserStorageAdapter.getSessions();
  const session = sessions.find((item) => item.id === resolvedSessionId);
  if (!session) return { ok: false, error: "Active session not found." };

  return { ok: true, session, sessionId: resolvedSessionId };
}

async function getConfiguredAdapter(): Promise<
  | { ok: true; adapter: ReturnType<typeof createLlmAdapter> }
  | { ok: false; error: string }
> {
  const settings = await browserStorageAdapter.getLlmSettingsForWorker();
  const adapter = createLlmAdapter(settingsFromStorage(settings));
  if (!adapter.isConfigured()) {
    return { ok: false, error: "Configure your LLM API settings before planning." };
  }
  return { ok: true, adapter };
}

async function completeWithJsonRepair(
  adapter: ReturnType<typeof createLlmAdapter>,
  system: string,
  user: string,
  parse: (content: string) => unknown,
): Promise<{ parsed: unknown; content: string }> {
  let content = (await adapter.complete({ system, user, temperature: 0.2 })).content;
  try {
    return { parsed: parse(content), content };
  } catch (error) {
    if (!(error instanceof PlanningParseError)) throw error;
    const repair = await adapter.complete({
      system: "Return valid JSON only.",
      user: buildJsonRepairPrompt(content),
      temperature: 0,
    });
    content = repair.content;
    return { parsed: parse(content), content };
  }
}

export async function generateBlueprintHandler(
  sessionId?: string,
  projectTitle?: string,
): Promise<ImplementoResponse<Blueprint>> {
  const sessionResult = await resolveSession(sessionId);
  if (!sessionResult.ok) return fail(sessionResult.error);

  const { session, sessionId: resolvedSessionId } = sessionResult;
  const themes = await browserStorageAdapter.listPainThemes(resolvedSessionId);
  if (themes.length === 0) {
    return fail("Run discovery and produce at least one pain theme first.");
  }

  const llmResult = await getConfiguredAdapter();
  if (!llmResult.ok) return fail(llmResult.error);

  const evidence = await browserStorageAdapter.listEvidence(resolvedSessionId);
  await browserStorageAdapter.ensureSeedProfiles();
  const profiles = await browserStorageAdapter.listCommunityProfiles();

  const system = buildBlueprintSystemPrompt();
  const user = buildBlueprintUserPrompt({
    sessionName: session.name,
    projectTitle: projectTitle?.trim() || session.name,
    themes,
    evidence,
    profiles,
  });

  try {
    const { parsed } = await completeWithJsonRepair(
      llmResult.adapter,
      system,
      user,
      parseBlueprintVariablesResponse,
    );
    let rendered = renderBlueprintFromVariables(
      parsed as ReturnType<typeof parseBlueprintVariablesResponse>,
    );

    if (!rendered.validation.valid) {
      const repair = await llmResult.adapter.complete({
        system: "Return valid JSON only.",
        user: buildSectionRepairPrompt(
          "blueprint",
          JSON.stringify(parsed),
          rendered.validation.missing,
        ),
        temperature: 0,
      });
      const repairedVars = parseBlueprintVariablesResponse(repair.content);
      rendered = renderBlueprintFromVariables(repairedVars);
      if (!rendered.validation.valid) {
        return fail(
          `Blueprint missing sections: ${rendered.validation.missing.join(", ")}`,
        );
      }
    }

    const blueprint = await browserStorageAdapter.upsertBlueprint(
      resolvedSessionId,
      rendered.markdown,
    );
    return ok(blueprint);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Blueprint generation failed.";
    return fail(message);
  }
}

export async function generatePhase0Handler(
  sessionId?: string,
): Promise<ImplementoResponse<PhasePlan>> {
  const sessionResult = await resolveSession(sessionId);
  if (!sessionResult.ok) return fail(sessionResult.error);

  const { session, sessionId: resolvedSessionId } = sessionResult;
  const blueprint = await browserStorageAdapter.getBlueprint(resolvedSessionId);
  if (!blueprint) {
    return fail("Generate a blueprint for this session first.");
  }

  const llmResult = await getConfiguredAdapter();
  if (!llmResult.ok) return fail(llmResult.error);

  const themes = await browserStorageAdapter.listPainThemes(resolvedSessionId);
  const system = buildPhase0SystemPrompt();
  const user = buildPhase0UserPrompt({
    sessionName: session.name,
    blueprintMarkdown: blueprint.markdown,
    themes,
  });

  try {
    const { parsed } = await completeWithJsonRepair(
      llmResult.adapter,
      system,
      user,
      parsePhase0VariablesResponse,
    );
    let rendered = renderPhase0FromVariables(
      parsed as ReturnType<typeof parsePhase0VariablesResponse>,
    );

    if (!rendered.validation.valid) {
      const repair = await llmResult.adapter.complete({
        system: "Return valid JSON only.",
        user: buildSectionRepairPrompt(
          "phase0",
          JSON.stringify(parsed),
          rendered.validation.missing,
        ),
        temperature: 0,
      });
      const repairedVars = parsePhase0VariablesResponse(repair.content);
      rendered = renderPhase0FromVariables(repairedVars);
      if (!rendered.validation.valid) {
        return fail(
          `Phase 0 plan missing sections: ${rendered.validation.missing.join(", ")}`,
        );
      }
    }

    const plan = await browserStorageAdapter.upsertPhasePlan(
      resolvedSessionId,
      0,
      rendered.markdown,
      "draft",
    );
    return ok(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Phase 0 generation failed.";
    return fail(message);
  }
}

export async function getBlueprintHandler(
  sessionId: string,
): Promise<ImplementoResponse<Blueprint | null>> {
  const blueprint = await browserStorageAdapter.getBlueprint(sessionId);
  return ok(blueprint);
}

export async function getPhasePlanHandler(
  sessionId: string,
  phaseNumber: number,
): Promise<ImplementoResponse<PhasePlan | null>> {
  const plan = await browserStorageAdapter.getPhasePlan(sessionId, phaseNumber);
  return ok(plan);
}

export async function markPhasePlanStatusHandler(
  sessionId: string,
  phaseNumber: number,
  status: PhasePlanStatus,
): Promise<ImplementoResponse<PhasePlan>> {
  const updated = await browserStorageAdapter.markPhasePlanStatus(
    sessionId,
    phaseNumber,
    status,
  );
  if (!updated) return fail("Phase plan not found.");
  return ok(updated);
}
