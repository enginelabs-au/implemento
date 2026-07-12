import { browserStorageAdapter } from "../../shared/storage/browser-storage";
import {
  buildJsonRepairPrompt,
  buildPostDraftsSystemPrompt,
  buildPostDraftsUserPrompt,
} from "../../shared/posts/prompt";
import { PostParseError, parsePostDraftsResponse } from "../../shared/posts/parser";
import { applyEthicsToDraft, PostEthicsError } from "../../shared/posts/ethics";
import { normalizeSubreddit } from "../../shared/posts/schema";
import {
  createLlmAdapter,
  settingsFromStorage,
} from "../../shared/llm/llm-adapter";
import type { PostDraft, ResearchSession } from "../../shared/types/domain";
import type { ImplementoResponse } from "../../shared/messages/types";

const MAX_SUBREDDITS_PER_RUN = 3;

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

async function getConfiguredAdapter() {
  const settings = await browserStorageAdapter.getLlmSettingsForWorker();
  const adapter = createLlmAdapter(settingsFromStorage(settings));
  if (!adapter.isConfigured()) {
    return { ok: false as const, error: "Configure your LLM API settings before generating posts." };
  }
  return { ok: true as const, adapter };
}

export interface GeneratePostDraftsResult {
  drafts: PostDraft[];
  warnings: string[];
}

export async function generatePostDraftsHandler(
  subreddits: string[],
  sessionId?: string,
): Promise<ImplementoResponse<GeneratePostDraftsResult>> {
  if (!subreddits.length) {
    return fail("Select at least one target subreddit.");
  }
  if (subreddits.length > MAX_SUBREDDITS_PER_RUN) {
    return fail(`Select at most ${MAX_SUBREDDITS_PER_RUN} subreddits per run.`);
  }

  const sessionResult = await resolveSession(sessionId);
  if (!sessionResult.ok) return fail(sessionResult.error);

  const { session, sessionId: resolvedSessionId } = sessionResult;
  const blueprint = await browserStorageAdapter.getBlueprint(resolvedSessionId);
  if (!blueprint) {
    return fail("Generate a blueprint for this session before drafting posts.");
  }

  const llmResult = await getConfiguredAdapter();
  if (!llmResult.ok) return fail(llmResult.error);

  await browserStorageAdapter.ensureSeedProfiles();
  const profiles = await browserStorageAdapter.listCommunityProfiles();
  const themes = await browserStorageAdapter.listPainThemes(resolvedSessionId);

  const normalizedTargets = subreddits.map((sub) => normalizeSubreddit(sub));
  const allDrafts: PostDraft[] = [];
  const warnings: string[] = [];

  try {
    for (const subreddit of normalizedTargets) {
      const profile =
        profiles.find(
          (item) =>
            item.subreddit.replace(/^r\//i, "").toLowerCase() === subreddit.toLowerCase(),
        ) ?? null;

      const system = buildPostDraftsSystemPrompt();
      const user = buildPostDraftsUserPrompt({
        subreddit,
        profile,
        blueprintMarkdown: blueprint.markdown,
        themes,
        sessionName: session.name,
      });

      let content = (await llmResult.adapter.complete({ system, user, temperature: 0.3 }))
        .content;
      let parsed: PostDraft[];

      try {
        parsed = parsePostDraftsResponse(content, resolvedSessionId, subreddit);
      } catch (error) {
        if (!(error instanceof PostParseError)) throw error;
        const repair = await llmResult.adapter.complete({
          system: "Return valid JSON only.",
          user: buildJsonRepairPrompt(content),
          temperature: 0,
        });
        content = repair.content;
        parsed = parsePostDraftsResponse(content, resolvedSessionId, subreddit);
      }

      for (const draft of parsed) {
        let processed: PostDraft;
        try {
          processed = applyEthicsToDraft(draft);
        } catch (error) {
          if (error instanceof PostEthicsError) {
            return fail(`${error.message} (r/${subreddit})`);
          }
          throw error;
        }
        allDrafts.push(processed);
        if (processed.promoRisk === "high") {
          warnings.push(`r/${subreddit} · ${processed.archetype}: high promotional risk`);
        }
      }
    }

    await browserStorageAdapter.replacePostDraftsForSubreddits(
      resolvedSessionId,
      normalizedTargets,
      allDrafts,
    );

    return ok({ drafts: allDrafts, warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Post draft generation failed.";
    return fail(message);
  }
}

export async function listPostDraftsHandler(
  sessionId: string,
): Promise<ImplementoResponse<PostDraft[]>> {
  const drafts = await browserStorageAdapter.listPostDrafts(sessionId);
  return ok(drafts);
}
