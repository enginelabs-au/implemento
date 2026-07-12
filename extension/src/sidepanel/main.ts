import {
  applyProfileSuggestion,
  autoCollectEvidence,
  loadCommunityProfiles,
  loadPainThemes,
  renderDiscoveryUi,
  renderProfilesUi,
  runDiscovery,
  runFullDiscovery,
  type DiscoveryPrefs,
} from "./discovery-ui";
import { isDiscoveryBusy } from "./discovery-operation";
import {
  generateBlueprint,
  generatePhase0,
  loadBlueprint,
  loadPhase0Plan,
  markPhase0Complete,
  renderPlanningUi,
} from "./planning-ui";
import {
  generatePostDrafts,
  loadPostDrafts,
  renderPostDraftMarkdown,
  renderPostsUi,
} from "./posts-ui";
import { loadPublicSettings, renderSettingsUi } from "./settings-ui";
import { exportSessionBundle, importSessionBundle, renderBundleUi } from "./bundle-ui";
import { renderSamplePhase0Plan } from "../shared/templates/engine";
import type { CommunityProfileSuggestion } from "../shared/types/domain";
import { createLabeledFieldWithWand } from "./suggest-ui";
import {
  createSession,
  listenForStorageUpdates,
  loadActiveSession,
  loadSessions,
  renderSessionControls,
  setActiveSession,
} from "./session-ui";
import {
  pinComment,
  pinManualEvidence,
  pinPost,
  pinSelection,
  refreshEvidence,
  refreshPageContext,
  renderCommentPinButtons,
  renderEvidenceList,
  renderPageCard,
  setFeedback,
  type CaptureUiState,
} from "./capture-ui";

function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const sessionControls = document.getElementById("session-controls");
const pageCard = document.getElementById("page-card");
const evidenceList = document.getElementById("evidence-list");
const commentPinList = document.getElementById("comment-pin-list");

const discoveryPanel = document.getElementById("discovery-panel");
const planningPanel = document.getElementById("planning-panel");
const postsPanel = document.getElementById("posts-panel");
const profilesPanel = document.getElementById("profiles-panel");
const settingsPanel = document.getElementById("settings-panel");
const bundlePanel = document.getElementById("bundle-panel");

let pendingSuggestions: CommunityProfileSuggestion[] = [];
let projectTitle = "";
let selectedSubreddits: string[] = [];
let discoveryPrefs: DiscoveryPrefs = { query: "", subreddits: "SaaS, startups" };

function setDiscoveryFeedback(message: string, ok?: boolean): void {
  const el = document.getElementById("discovery-feedback");
  if (!el) return;
  el.textContent = message;
  if (!message) {
    el.className = "";
    return;
  }
  el.className =
    ok === false ? "discovery-result-error" : ok === true ? "discovery-result-ok" : "";
}

const state: CaptureUiState = {
  pageContext: null,
  pageError: null,
  evidence: [],
  activeSessionId: null,
};

async function ensureDefaultSession(): Promise<void> {
  const sessions = await loadSessions();
  if (sessions.length === 0) {
    await createSession("My research");
    return;
  }
  const active = await loadActiveSession();
  if (!active && sessions[0]) {
    await setActiveSession(sessions[0].id);
  }
}

async function refreshAll(): Promise<void> {
  await ensureDefaultSession();
  const sessions = await loadSessions();
  const activeSession = await loadActiveSession();
  state.activeSessionId = activeSession?.id ?? null;
  const publicSettings = await loadPublicSettings();

  if (sessionControls) {
    renderSessionControls(sessionControls, sessions, activeSession, {
      llmConfigured: publicSettings.configured,
      onFeedback: (message) => setFeedback("capture-feedback", message),
    });
  }

  if (bundlePanel) {
    renderBundleUi(bundlePanel, {
      hasSession: Boolean(state.activeSessionId),
      sessionName: activeSession?.name ?? "",
      onExport: async () => {
        if (!state.activeSessionId) {
          setFeedback("bundle-feedback", "Select a session first.");
          return;
        }
        setFeedback("bundle-feedback", "Preparing bundle…");
        const result = await exportSessionBundle(state.activeSessionId);
        if (!result.ok || !result.json) {
          setFeedback("bundle-feedback", result.message);
          return;
        }
        const slug =
          (activeSession?.name ?? "session")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "session";
        const date = new Date().toISOString().slice(0, 10);
        downloadJson(`implemento-session_${slug}_${date}.json`, result.json);
        setFeedback("bundle-feedback", "Session bundle downloaded.");
      },
      onImport: async (file, replaceIfExists) => {
        setFeedback("bundle-feedback", "Importing bundle…");
        try {
          const raw = await file.text();
          const message = await importSessionBundle(raw, replaceIfExists);
          setFeedback("bundle-feedback", message);
          await refreshAll();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Import failed.";
          setFeedback("bundle-feedback", message);
        }
      },
    });
  }

  const page = await refreshPageContext();
  state.pageContext = page.context;
  state.pageError = page.error;

  if (pageCard) renderPageCard(pageCard, state);
  if (commentPinList) {
    renderCommentPinButtons(commentPinList, state, async (commentId) => {
      if (!state.activeSessionId || !state.pageContext) {
        setFeedback("capture-feedback", "Select a session and open a Reddit post.");
        return;
      }
      const message = await pinComment(
        state.activeSessionId,
        state.pageContext,
        commentId,
      );
      setFeedback("capture-feedback", message);
      await refreshAll();
    });
  }

  state.evidence = await refreshEvidence(state.activeSessionId);
  if (evidenceList) renderEvidenceList(evidenceList, state.evidence);

  if (settingsPanel) {
    renderSettingsUi(settingsPanel, publicSettings, (message) =>
      setFeedback("settings-feedback", message),
    );
  }

  const profiles = await loadCommunityProfiles();
  if (profilesPanel) {
    renderProfilesUi(profilesPanel, profiles, {
      llmConfigured: publicSettings.configured,
      sessionId: state.activeSessionId,
      onFeedback: (message) => setFeedback("discovery-feedback", message),
    });
  }

  const themes = state.activeSessionId
    ? await loadPainThemes(state.activeSessionId)
    : [];

  if (discoveryPanel) {
    if (!discoveryPrefs.query && activeSession) {
      discoveryPrefs = {
        ...discoveryPrefs,
        query: activeSession.name,
      };
    }

    renderDiscoveryUi(
      discoveryPanel,
      themes,
      state.evidence,
      pendingSuggestions,
      publicSettings.configured,
      Boolean(state.activeSessionId),
      state.activeSessionId,
      discoveryPrefs,
      (prefs) => {
        discoveryPrefs = prefs;
      },
      (message, ok) => setDiscoveryFeedback(message, ok),
      async (prefs) => {
        if (!state.activeSessionId) {
          return { ok: false, message: "Select a session first." };
        }
        discoveryPrefs = prefs;
        const result = await runFullDiscovery(state.activeSessionId, prefs);
        if (result.suggestions) {
          pendingSuggestions = result.suggestions;
        }
        return result;
      },
      async (prefs) => {
        if (!state.activeSessionId) {
          return { ok: false, message: "Select a session first." };
        }
        discoveryPrefs = prefs;
        return autoCollectEvidence(state.activeSessionId, prefs);
      },
      async () => {
        if (!state.activeSessionId) {
          return { ok: false, message: "Select a session first." };
        }
        const result = await runDiscovery(state.activeSessionId);
        if (result.suggestions) {
          pendingSuggestions = result.suggestions;
        }
        return result;
      },
      async (suggestion) => {
        const message = await applyProfileSuggestion(suggestion);
        setDiscoveryFeedback(message, message.includes("saved") || message.includes("applied"));
        pendingSuggestions = pendingSuggestions.filter(
          (item) => item.subreddit !== suggestion.subreddit,
        );
        await refreshAll();
      },
      refreshAll,
    );
  }

  const blueprint = state.activeSessionId
    ? await loadBlueprint(state.activeSessionId)
    : null;
  const phase0 = state.activeSessionId
    ? await loadPhase0Plan(state.activeSessionId)
    : null;

  if (planningPanel) {
    if (!projectTitle && activeSession) {
      projectTitle = activeSession.name;
    }
    renderPlanningUi(planningPanel, {
      configured: publicSettings.configured,
      hasThemes: themes.length > 0,
      sessionId: state.activeSessionId,
      projectTitle,
      blueprint,
      phase0,
      onProjectTitleChange: (value) => {
        projectTitle = value;
      },
      onGenerateBlueprint: async () => {
        if (!state.activeSessionId) {
          setFeedback("planning-feedback", "Select a session first.");
          return;
        }
        setFeedback("planning-feedback", "Generating blueprint…");
        const result = await generateBlueprint(state.activeSessionId, projectTitle);
        setFeedback("planning-feedback", result.message);
        await refreshAll();
      },
      onGeneratePhase0: async () => {
        if (!state.activeSessionId) {
          setFeedback("planning-feedback", "Select a session first.");
          return;
        }
        setFeedback("planning-feedback", "Generating phase 0 plan…");
        const result = await generatePhase0(state.activeSessionId);
        setFeedback("planning-feedback", result.message);
        await refreshAll();
      },
      onExportBlueprint: () => {
        if (!blueprint) return;
        const slug = projectTitle
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "project";
        const date = new Date().toISOString().slice(0, 10);
        downloadMarkdown(`${date}_${slug}_blueprint.md`, blueprint.markdown);
        setFeedback("planning-feedback", "Blueprint downloaded.");
      },
      onExportPhase0: () => {
        if (!phase0) return;
        const date = new Date().toISOString().slice(0, 10);
        downloadMarkdown(`phase_0_foundations_plan_${date}.md`, phase0.markdown);
        setFeedback("planning-feedback", "Phase 0 plan downloaded.");
      },
      onMarkPhase0Complete: async () => {
        if (!state.activeSessionId) return;
        const message = await markPhase0Complete(state.activeSessionId);
        setFeedback("planning-feedback", message);
        await refreshAll();
      },
    });
  }

  const postDrafts = state.activeSessionId
    ? await loadPostDrafts(state.activeSessionId)
    : [];

  const availableSubreddits = [
    ...new Set([
      ...(activeSession?.subreddits ?? []),
      ...profiles.map((p) => p.subreddit),
    ]),
  ].sort();

  if (selectedSubreddits.length === 0 && availableSubreddits.length > 0) {
    selectedSubreddits = availableSubreddits.slice(0, Math.min(3, availableSubreddits.length));
  }

  if (postsPanel) {
    renderPostsUi(postsPanel, {
      configured: publicSettings.configured,
      hasBlueprint: Boolean(blueprint),
      availableSubreddits,
      selectedSubreddits,
      drafts: postDrafts,
      onSelectionChange: (subs) => {
        selectedSubreddits = subs;
      },
      onGenerate: async () => {
        if (!state.activeSessionId) {
          setFeedback("posts-feedback", "Select a session first.");
          return;
        }
        if (selectedSubreddits.length === 0) {
          setFeedback("posts-feedback", "Select at least one subreddit.");
          return;
        }
        setFeedback("posts-feedback", "Generating post drafts…");
        const result = await generatePostDrafts(
          state.activeSessionId,
          selectedSubreddits,
        );
        setFeedback("posts-feedback", result.message);
        await refreshAll();
      },
      onExportDraft: (draft) => {
        const date = new Date().toISOString().slice(0, 10);
        downloadMarkdown(
          `${date}_r-${draft.subreddit}_${draft.archetype}.md`,
          renderPostDraftMarkdown(draft),
        );
        setFeedback("posts-feedback", "Draft exported.");
      },
      onExportAll: () => {
        const bundle = postDrafts.map((draft) => renderPostDraftMarkdown(draft)).join("\n\n---\n\n");
        const date = new Date().toISOString().slice(0, 10);
        downloadMarkdown(`post_drafts_${date}.md`, bundle);
        setFeedback("posts-feedback", "All drafts exported.");
      },
    });
  }
}

document.getElementById("refresh-page")?.addEventListener("click", () => {
  void refreshAll();
});

document.getElementById("pin-post")?.addEventListener("click", async () => {
  if (!state.activeSessionId || !state.pageContext) {
    setFeedback("capture-feedback", "Select a session and open a Reddit post.");
    return;
  }
  const message = await pinPost(state.activeSessionId, state.pageContext);
  setFeedback("capture-feedback", message);
  await refreshAll();
});

document.getElementById("pin-selection")?.addEventListener("click", async () => {
  if (!state.activeSessionId || !state.pageContext) {
    setFeedback("capture-feedback", "Select a session and highlight text on Reddit.");
    return;
  }
  const message = await pinSelection(state.activeSessionId, state.pageContext);
  setFeedback("capture-feedback", message);
  await refreshAll();
});

document.getElementById("manual-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.activeSessionId) {
    setFeedback("capture-feedback", "Create or select a session first.");
    return;
  }

  const subreddit = (document.getElementById("manual-subreddit") as HTMLInputElement).value;
  const url = (document.getElementById("manual-url") as HTMLInputElement).value;
  const quote = (document.getElementById("manual-quote") as HTMLTextAreaElement).value;

  const message = await pinManualEvidence(state.activeSessionId, {
    subreddit,
    redditUrl: url,
    quote,
    type: "post",
  });
  setFeedback("capture-feedback", message);
  (document.getElementById("manual-quote") as HTMLTextAreaElement).value = "";
  await refreshAll();
});

document.getElementById("export-sample")?.addEventListener("click", () => {
  try {
    const markdown = renderSamplePhase0Plan();
    const date = new Date().toISOString().slice(0, 10);
    downloadMarkdown(`phase_0_foundations_sample_${date}.md`, markdown);
    setFeedback("export-feedback", "Sample phase 0 plan downloaded.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    setFeedback("export-feedback", message);
  }
});

listenForStorageUpdates(() => {
  if (isDiscoveryBusy()) return;
  void refreshAll();
});

void refreshAll();
