import type {
  ActiveSessionResponse,
  EvidenceListResponse,
  ImplementoMessage,
  ImplementoResponse,
  SessionsResponse,
} from "../../shared/messages/types";
import { STORAGE_UPDATED_EVENT } from "../../shared/messages/types";
import { browserStorageAdapter } from "../../shared/storage/browser-storage";
import { fetchPageContext, sendToActiveRedditTab } from "./tabs";
import {
  applyProfileSuggestionHandler,
  runDiscoveryHandler,
} from "./discovery";
import { autoCollectEvidenceHandler } from "./auto-collect";
import {
  generateBlueprintHandler,
  generatePhase0Handler,
  getBlueprintHandler,
  getPhasePlanHandler,
  markPhasePlanStatusHandler,
} from "./planning";
import {
  generatePostDraftsHandler,
  listPostDraftsHandler,
} from "./posts";
import {
  exportSessionBundleHandler,
  importSessionBundleHandler,
} from "./bundle";
import { suggestFieldHandler } from "./suggestions";
import {
  getSettingsHandler,
  saveSettingsHandler,
  testLlmConnectionHandler,
} from "./settings";

function fail(error: string): ImplementoResponse<never> {
  return { ok: false, error };
}

function ok<T>(data?: T): ImplementoResponse<T> {
  return { ok: true, data };
}

async function notifyStorageUpdated(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ type: STORAGE_UPDATED_EVENT });
  } catch {
    // Side panel may be closed; ignore.
  }
}

export async function handleMessage(
  message: ImplementoMessage,
): Promise<ImplementoResponse<unknown>> {
  switch (message.type) {
    case "PING":
      return ok();

    case "GET_PAGE_CONTEXT":
      return fetchPageContext(message.useJsonFallback);

    case "GET_SELECTION":
      return sendToActiveRedditTab<{ text: string }>({ type: "GET_SELECTION" });

    case "CREATE_SESSION": {
      const session = await browserStorageAdapter.createSession(message.name);
      await notifyStorageUpdated();
      return ok(session);
    }

    case "LIST_SESSIONS": {
      const sessions = await browserStorageAdapter.getSessions();
      return ok(sessions);
    }

    case "SET_ACTIVE_SESSION": {
      await browserStorageAdapter.setActiveSessionId(message.sessionId);
      await notifyStorageUpdated();
      return ok();
    }

    case "GET_ACTIVE_SESSION": {
      const sessionId = await browserStorageAdapter.getActiveSessionId();
      if (!sessionId) return ok({ session: null });
      const sessions = await browserStorageAdapter.getSessions();
      const session = sessions.find((s) => s.id === sessionId) ?? null;
      return ok({ session });
    }

    case "PIN_EVIDENCE": {
      const activeSessionId = await browserStorageAdapter.getActiveSessionId();
      if (!activeSessionId) {
        return fail("Create or select a research session first.");
      }
      const result = await browserStorageAdapter.addEvidence({
        ...message.evidence,
        sessionId: message.evidence.sessionId || activeSessionId,
      });
      await notifyStorageUpdated();
      return ok({
        evidence: result.evidence,
        duplicate: result.duplicate,
      });
    }

    case "LIST_EVIDENCE": {
      const evidence = await browserStorageAdapter.listEvidence(message.sessionId);
      return ok(evidence);
    }

    case "REMOVE_EVIDENCE": {
      const removed = await browserStorageAdapter.removeEvidence(message.evidenceId);
      if (!removed) return fail("Evidence not found.");
      await notifyStorageUpdated();
      return ok();
    }

    case "SAVE_SETTINGS":
      return saveSettingsHandler(message.settings);

    case "GET_SETTINGS":
      return getSettingsHandler();

    case "TEST_LLM_CONNECTION":
      return testLlmConnectionHandler();

    case "SUGGEST_FIELD":
      return suggestFieldHandler({
        fieldType: message.fieldType,
        sessionId: message.sessionId,
        subreddit: message.subreddit,
        currentValue: message.currentValue,
        variationSeed: message.variationSeed,
      });

    case "RUN_DISCOVERY": {
      const result = await runDiscoveryHandler(message.sessionId);
      if (result.ok) await notifyStorageUpdated();
      return result;
    }

    case "AUTO_COLLECT_EVIDENCE": {
      const result = await autoCollectEvidenceHandler(message.sessionId, {
        query: message.query,
        subreddits: message.subreddits,
      });
      if (result.ok) await notifyStorageUpdated();
      return result;
    }

    case "RUN_FULL_DISCOVERY": {
      const resolvedSessionId =
        message.sessionId ?? (await browserStorageAdapter.getActiveSessionId());
      if (!resolvedSessionId) {
        return fail("Create or select a research session first.");
      }

      const runId = crypto.randomUUID();
      const removed = await browserStorageAdapter.removeAutoCollectedEvidence(resolvedSessionId);
      const collect = await autoCollectEvidenceHandler(resolvedSessionId, {
        query: message.query,
        subreddits: message.subreddits,
        runId,
      });
      if (!collect.ok) return collect;

      const pinned = collect.data?.pinned ?? 0;
      if (pinned === 0) {
        const clearedNote =
          removed > 0 ? ` Cleared ${removed} item(s) from the previous discovery run.` : "";
        return fail(
          `No new Reddit evidence found for this query.${clearedNote} Try a broader query or different subreddits.`,
        );
      }

      const analysis = await runDiscoveryHandler(resolvedSessionId, {
        researchQuery: message.query,
        subreddits: message.subreddits,
        runId,
      });
      if (!analysis.ok) {
        const suffix =
          collect.data && collect.data.errors.length > 0
            ? ` Collection warnings: ${collect.data.errors.slice(0, 2).join("; ")}`
            : "";
        return fail(`${analysis.error}${suffix}`);
      }

      await notifyStorageUpdated();
      const themeCount = analysis.data?.themes.length ?? 0;
      const clearedNote =
        removed > 0 ? ` Replaced ${removed} prior auto-collected item(s).` : "";
      return ok({
        ...analysis.data,
        collectStats: collect.data,
        message: `Collected ${pinned} new item(s) from Reddit, then found ${themeCount} pain theme(s).${clearedNote}`,
      });
    }

    case "LIST_PAIN_THEMES": {
      const themes = await browserStorageAdapter.listPainThemes(message.sessionId);
      return ok(themes);
    }

    case "LIST_COMMUNITY_PROFILES": {
      await browserStorageAdapter.ensureSeedProfiles();
      const profiles = await browserStorageAdapter.listCommunityProfiles();
      return ok(profiles);
    }

    case "UPDATE_COMMUNITY_PROFILE": {
      await browserStorageAdapter.upsertCommunityProfile(message.profile);
      await notifyStorageUpdated();
      return ok();
    }

    case "APPLY_PROFILE_SUGGESTION": {
      const result = await applyProfileSuggestionHandler(message.suggestion);
      if (result.ok) await notifyStorageUpdated();
      return result;
    }

    case "GENERATE_BLUEPRINT": {
      const result = await generateBlueprintHandler(
        message.sessionId,
        message.projectTitle,
      );
      if (result.ok) await notifyStorageUpdated();
      return result;
    }

    case "GENERATE_PHASE0": {
      const result = await generatePhase0Handler(message.sessionId);
      if (result.ok) await notifyStorageUpdated();
      return result;
    }

    case "GET_BLUEPRINT": {
      return getBlueprintHandler(message.sessionId);
    }

    case "GET_PHASE_PLAN": {
      return getPhasePlanHandler(message.sessionId, message.phaseNumber);
    }

    case "MARK_PHASE_PLAN_STATUS": {
      const result = await markPhasePlanStatusHandler(
        message.sessionId,
        message.phaseNumber,
        message.status,
      );
      if (result.ok) await notifyStorageUpdated();
      return result;
    }

    case "GENERATE_POST_DRAFTS": {
      const result = await generatePostDraftsHandler(
        message.subreddits,
        message.sessionId,
      );
      if (result.ok) await notifyStorageUpdated();
      return result;
    }

    case "LIST_POST_DRAFTS": {
      return listPostDraftsHandler(message.sessionId);
    }

    case "EXPORT_SESSION_BUNDLE": {
      const result = await exportSessionBundleHandler(message.sessionId);
      return result;
    }

    case "IMPORT_SESSION_BUNDLE": {
      const result = await importSessionBundleHandler(
        message.raw,
        message.replaceIfExists,
      );
      if (result.ok) await notifyStorageUpdated();
      return result;
    }

    default:
      return fail("Unknown message type.");
  }
}

export type {
  ActiveSessionResponse,
  EvidenceListResponse,
  SessionsResponse,
};
