import type { ImplementoResponse } from "../../shared/messages/types";
import type { PageContext } from "../../shared/reddit/types";
import {
  buildAutoCollectPlan,
  deepPostUrlsFromContext,
  evidenceFromPageContext,
  type AutoCollectInput,
} from "../../shared/reddit/auto-collect";
import { browserStorageAdapter } from "../../shared/storage/browser-storage";
import { fetchPageContextFromUrl, sendToActiveRedditTab } from "./tabs";

export interface AutoCollectResult {
  pinned: number;
  duplicates: number;
  sourcesVisited: number;
  errors: string[];
}

function ok<T>(data: T): ImplementoResponse<T> {
  return { ok: true, data };
}

function fail(error: string): ImplementoResponse<never> {
  return { ok: false, error };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pinCollectible(
  sessionId: string,
  item: ReturnType<typeof evidenceFromPageContext>[number],
): Promise<"pinned" | "duplicate"> {
  const result = await browserStorageAdapter.addEvidence({
    sessionId,
    redditUrl: item.redditUrl,
    subreddit: item.subreddit,
    quote: item.quote,
    type: item.type,
    tags: item.tags,
  });
  return result.duplicate ? "duplicate" : "pinned";
}

async function collectFromContext(
  sessionId: string,
  context: PageContext,
  stats: AutoCollectResult,
): Promise<void> {
  for (const item of evidenceFromPageContext(context)) {
    const outcome = await pinCollectible(sessionId, item);
    if (outcome === "pinned") stats.pinned += 1;
    else stats.duplicates += 1;
  }

  const deepUrls = deepPostUrlsFromContext(context);
  for (const url of deepUrls) {
    try {
      const response = await fetchPageContextFromUrl(url, true);
      if (!response.ok || !response.data) {
        stats.errors.push(
          `${url}: ${!response.ok ? response.error : "parse failed"}`,
        );
        continue;
      }
      for (const item of evidenceFromPageContext(response.data)) {
        const outcome = await pinCollectible(sessionId, item);
        if (outcome === "pinned") stats.pinned += 1;
        else stats.duplicates += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "deep collect failed";
      stats.errors.push(`${url}: ${message}`);
    }
  }
}

export async function autoCollectEvidenceHandler(
  sessionId: string | undefined,
  input: AutoCollectInput,
): Promise<ImplementoResponse<AutoCollectResult>> {
  const keepAlive = setInterval(() => {
    void chrome.runtime.getPlatformInfo();
  }, 20_000);

  try {
  const resolvedSessionId =
    sessionId ?? (await browserStorageAdapter.getActiveSessionId());
  if (!resolvedSessionId) {
    return fail("Create or select a research session first.");
  }

  const plan = buildAutoCollectPlan(input);
  const stats: AutoCollectResult = {
    pinned: 0,
    duplicates: 0,
    sourcesVisited: 0,
    errors: [],
  };

  if (plan.urls.length === 0) {
    const active = await sendToActiveRedditTab<PageContext>({
      type: "GET_PAGE_CONTEXT",
      useJsonFallback: true,
    });
    if (!active.ok || !active.data) {
      return fail(
        "Enter a search query or subreddit, or open a Reddit search/subreddit tab.",
      );
    }
    stats.sourcesVisited += 1;
    await collectFromContext(resolvedSessionId, active.data, stats);
  } else {
    for (const url of plan.urls) {
      try {
        const response = await fetchPageContextFromUrl(url, false);
        if (!response.ok || !response.data) {
          stats.errors.push(
            `${url}: ${!response.ok ? response.error : "parse failed"}`,
          );
          continue;
        }
        stats.sourcesVisited += 1;
        await collectFromContext(resolvedSessionId, response.data, stats);
      } catch (error) {
        const message = error instanceof Error ? error.message : "collect failed";
        stats.errors.push(`${url}: ${message}`);
      }
      await sleep(400);
    }
  }

  if (stats.pinned === 0 && stats.duplicates === 0 && stats.errors.length > 0) {
    return fail(`Could not collect evidence.\n${stats.errors.slice(0, 3).join("\n")}`);
  }

  return ok(stats);
  } finally {
    clearInterval(keepAlive);
  }
}
