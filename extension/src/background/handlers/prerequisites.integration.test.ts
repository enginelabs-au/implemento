import { beforeEach, describe, expect, it } from "vitest";
import { mergeWithDefaults } from "../../shared/storage/storage-adapter";
import { createResearchSession } from "../../shared/types/domain";
import { generateBlueprintHandler } from "./planning";
import { generatePostDraftsHandler } from "./posts";

const STORAGE_KEY = "implemento_data";

async function seedStorage(data: ReturnType<typeof mergeWithDefaults>): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
}

describe("handler prerequisites", () => {
  beforeEach(async () => {
    await chrome.storage.local.set({});
  });

  it("blocks blueprint generation without pain themes", async () => {
    const session = createResearchSession("No themes");
    await seedStorage(
      mergeWithDefaults({
        sessions: [session],
        settings: { activeSessionId: session.id },
      }),
    );

    const result = await generateBlueprintHandler(session.id);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/pain theme/i);
    }
  });

  it("blocks post drafts without blueprint", async () => {
    const session = createResearchSession("No blueprint");
    await seedStorage(
      mergeWithDefaults({
        sessions: [session],
        settings: { activeSessionId: session.id },
        painThemes: [
          {
            id: "theme-1",
            sessionId: session.id,
            title: "Pain",
            summary: "Summary",
            evidenceIds: [],
            severity: 7,
            frequency: "high",
            inferenceFlag: false,
            workaroundPhrases: [],
            buyerSignals: [],
          },
        ],
      }),
    );

    const result = await generatePostDraftsHandler(["SaaS"], session.id);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/blueprint/i);
    }
  });
});
