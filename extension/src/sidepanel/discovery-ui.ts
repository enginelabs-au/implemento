import type { CommunityProfile, CommunityProfileSuggestion } from "../shared/types/domain";
import type { EvidenceItem, PainTheme } from "../shared/types/domain";
import { sendMessage } from "../shared/messages/client";
import { createLabeledFieldWithWand } from "./suggest-ui";
import {
  endDiscoveryOperation,
  estimateAnalyzeSeconds,
  estimateCollectSeconds,
  estimateFullSeconds,
  formatProgressLabel,
  startDiscoveryOperation,
  type DiscoveryOperationKind,
} from "./discovery-operation";

export interface DiscoveryPrefs {
  query: string;
  subreddits: string;
}

export interface DiscoveryActionResult {
  ok: boolean;
  message: string;
  suggestions?: CommunityProfileSuggestion[];
}

export interface AutoCollectStats {
  pinned: number;
  duplicates: number;
  sourcesVisited: number;
  errors: string[];
}

export async function loadCommunityProfiles(): Promise<CommunityProfile[]> {
  const response = await sendMessage<CommunityProfile[]>({ type: "LIST_COMMUNITY_PROFILES" });
  return response.ok ? (response.data ?? []) : [];
}

export async function saveCommunityProfile(profile: CommunityProfile): Promise<string> {
  const response = await sendMessage({
    type: "UPDATE_COMMUNITY_PROFILE",
    profile,
  });
  return response.ok ? "Profile saved." : response.error;
}

export async function applyProfileSuggestion(
  suggestion: CommunityProfileSuggestion,
): Promise<string> {
  const response = await sendMessage({
    type: "APPLY_PROFILE_SUGGESTION",
    suggestion,
  });
  return response.ok ? "Suggestion applied." : response.error;
}

export function renderProfilesUi(
  root: HTMLElement,
  profiles: CommunityProfile[],
  options: {
    llmConfigured: boolean;
    sessionId: string | null;
    onFeedback: (message: string) => void;
  },
): void {
  root.replaceChildren();

  if (profiles.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No community profiles loaded.";
    root.append(empty);
    return;
  }

  for (const profile of profiles) {
    const details = document.createElement("details");
    details.className = "profile-card";
    details.open = false;

    const summary = document.createElement("summary");
    summary.textContent = `r/${profile.subreddit}`;
    details.append(summary);

    const tone = createEditableField(
      "Tone",
      profile.tone,
      "community_tone",
      profile.subreddit,
      options,
    );
    const rules = createEditableField(
      "Rules notes",
      profile.rulesNotes,
      "community_rules",
      profile.subreddit,
      options,
    );
    const promo = createEditableField(
      "Promo policy",
      profile.promoPolicy,
      "community_promo",
      profile.subreddit,
      options,
    );
    const patterns = createEditableField(
      "Post patterns (comma-separated)",
      profile.postPatterns.join(", "),
      "community_patterns",
      profile.subreddit,
      options,
    );

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "secondary small";
    saveBtn.textContent = "Save profile";
    saveBtn.addEventListener("click", async () => {
      const message = await saveCommunityProfile({
        subreddit: profile.subreddit,
        tone: tone.input.value,
        rulesNotes: rules.input.value,
        promoPolicy: promo.input.value,
        postPatterns: patterns.input.value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      options.onFeedback(message);
    });

    details.addEventListener("implemento:suggest-error", (event) => {
      options.onFeedback((event as CustomEvent<string>).detail);
    });

    details.append(tone.label, rules.label, promo.label, patterns.label, saveBtn);
    root.append(details);
  }
}

function createEditableField(
  labelText: string,
  value: string,
  fieldType:
    | "community_tone"
    | "community_rules"
    | "community_promo"
    | "community_patterns",
  subreddit: string,
  options: {
    llmConfigured: boolean;
    sessionId: string | null;
    onFeedback: (message: string) => void;
  },
): { label: HTMLElement; input: HTMLInputElement } {
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  const label = createLabeledFieldWithWand(labelText, input, fieldType, {
    enabled: options.llmConfigured,
    sessionId: options.sessionId,
    subreddit,
    onApplied: () => options.onFeedback(`Suggestion applied to ${labelText.toLowerCase()}.`),
  });
  label.addEventListener("implemento:suggest-error", (event) => {
    options.onFeedback((event as CustomEvent<string>).detail);
  });
  return { label, input };
}

export async function loadPainThemes(sessionId: string): Promise<PainTheme[]> {
  const response = await sendMessage<PainTheme[]>({
    type: "LIST_PAIN_THEMES",
    sessionId,
  });
  return response.ok ? (response.data ?? []) : [];
}

export async function runDiscovery(sessionId: string): Promise<DiscoveryActionResult> {
  const response = await sendMessage<{
    themes: PainTheme[];
    suggestions: CommunityProfileSuggestion[];
  }>({
    type: "RUN_DISCOVERY",
    sessionId,
  });

  if (!response.ok) {
    return { ok: false, message: response.error, suggestions: [] };
  }

  const count = response.data?.themes.length ?? 0;
  return {
    ok: true,
    message: `Discovery complete — ${count} pain theme(s) found.`,
    suggestions: response.data?.suggestions ?? [],
  };
}

export async function autoCollectEvidence(
  sessionId: string,
  prefs: DiscoveryPrefs,
): Promise<DiscoveryActionResult> {
  const subreddits = prefs.subreddits
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const response = await sendMessage<AutoCollectStats>({
    type: "AUTO_COLLECT_EVIDENCE",
    sessionId,
    query: prefs.query.trim() || undefined,
    subreddits,
  });

  if (!response.ok) {
    return { ok: false, message: response.error };
  }

  const stats = response.data;
  const warnings =
    stats && stats.errors.length > 0
      ? `\n\nWarnings:\n${stats.errors.slice(0, 3).join("\n")}`
      : "";
  const summary =
    stats && stats.pinned === 0 && (stats.duplicates ?? 0) > 0
      ? `No new evidence found (${stats.duplicates} duplicate(s) skipped).`
      : `Collected ${stats?.pinned ?? 0} new item(s) from ${stats?.sourcesVisited ?? 0} Reddit source(s)${
          stats?.duplicates ? ` (${stats.duplicates} duplicate(s) skipped)` : ""
        }.`;

  return {
    ok: true,
    message: `${summary}${warnings}`,
  };
}

export async function runFullDiscovery(
  sessionId: string,
  prefs: DiscoveryPrefs,
): Promise<DiscoveryActionResult> {
  const subreddits = prefs.subreddits
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const response = await sendMessage<{
    themes: PainTheme[];
    suggestions: CommunityProfileSuggestion[];
    message?: string;
  }>({
    type: "RUN_FULL_DISCOVERY",
    sessionId,
    query: prefs.query.trim() || undefined,
    subreddits,
  });

  if (!response.ok) {
    return { ok: false, message: response.error, suggestions: [] };
  }

  return {
    ok: true,
    message:
      response.data?.message ??
      `Found ${response.data?.themes.length ?? 0} pain theme(s).`,
    suggestions: response.data?.suggestions ?? [],
  };
}

function parseSubredditList(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.replace(/^r\//i, "").trim())
    .filter(Boolean);
}

function renderInlineProgress(
  container: HTMLElement,
  message: string,
  estimateSeconds: number,
  startedAt: number,
): void {
  container.replaceChildren();
  container.hidden = false;
  container.className = "discovery-progress";

  const row = document.createElement("div");
  row.className = "discovery-progress-row";

  const spinner = document.createElement("span");
  spinner.className = "discovery-spinner";

  const text = document.createElement("span");
  text.className = "discovery-progress-text";
  const remaining = Math.max(0, estimateSeconds - Math.floor((Date.now() - startedAt) / 1000));
  text.textContent = remaining > 0 ? `${message} ~${remaining}s remaining` : `${message} Finishing up…`;

  row.append(spinner, text);
  container.append(row);

  const bar = document.createElement("div");
  bar.className = "discovery-progress-bar";
  const fill = document.createElement("div");
  fill.className = "discovery-progress-fill";
  const pct = Math.min(95, ((Date.now() - startedAt) / (estimateSeconds * 1000)) * 100);
  fill.style.width = `${pct}%`;
  bar.append(fill);
  container.append(bar);
}

export function renderDiscoveryUi(
  root: HTMLElement,
  themes: PainTheme[],
  evidence: EvidenceItem[],
  suggestions: CommunityProfileSuggestion[],
  configured: boolean,
  hasSession: boolean,
  sessionId: string | null,
  prefs: DiscoveryPrefs,
  onPrefsChange: (prefs: DiscoveryPrefs) => void,
  onFeedback: (message: string, ok?: boolean) => void,
  onFullDiscovery: (prefs: DiscoveryPrefs) => Promise<DiscoveryActionResult>,
  onCollectOnly: (prefs: DiscoveryPrefs) => Promise<DiscoveryActionResult>,
  onAnalyze: () => Promise<DiscoveryActionResult>,
  onApplySuggestion: (suggestion: CommunityProfileSuggestion) => void,
  onComplete: () => Promise<void>,
): void {
  root.replaceChildren();

  const statusBox = document.createElement("div");
  statusBox.id = "discovery-inline-progress";
  statusBox.hidden = true;
  root.append(statusBox);

  const intro = document.createElement("p");
  intro.className = "muted";
  intro.textContent =
    "Implemento searches Reddit for you — enter a topic and subreddits, then run discovery.";
  root.append(intro);

  const form = document.createElement("form");
  form.id = "discovery-form";

  const queryInput = document.createElement("input");
  queryInput.type = "text";
  queryInput.id = "discovery-query";
  queryInput.placeholder = "e.g. saas validation pain";
  queryInput.value = prefs.query;

  const subredditInput = document.createElement("input");
  subredditInput.type = "text";
  subredditInput.id = "discovery-subreddits";
  subredditInput.placeholder = "SaaS, startups, entrepreneur";
  subredditInput.value = prefs.subreddits;

  let running = false;

  const hasTargets = () =>
    queryInput.value.trim().length > 0 ||
    parseSubredditList(subredditInput.value).length > 0;

  const discoverBtn = document.createElement("button");
  discoverBtn.type = "submit";
  discoverBtn.id = "discover-pains";
  discoverBtn.textContent = "Discover pains";

  const collectBtn = document.createElement("button");
  collectBtn.type = "button";
  collectBtn.className = "secondary";
  collectBtn.id = "collect-evidence";
  collectBtn.textContent = "Find evidence only";

  const analyzeBtn = document.createElement("button");
  analyzeBtn.type = "button";
  analyzeBtn.className = "secondary";
  analyzeBtn.id = "analyze-session";
  analyzeBtn.textContent = "Analyze existing evidence";

  const disabledReason = (kind: "full" | "collect" | "analyze"): string => {
    if (running) return "A discovery task is already running.";
    if (!hasSession) return "Create or select a research session first (section above).";
    if (!hasTargets() && kind !== "analyze") {
      return "Enter a research query and/or at least one subreddit.";
    }
    if (!configured && kind !== "collect") {
      return "Configure LLM in Settings (rebuild after updating .env).";
    }
    if (kind === "analyze" && evidence.length === 0) {
      return "No evidence yet — run Find evidence or Discover pains first.";
    }
    return "";
  };

  const syncButtonState = () => {
    discoverBtn.disabled = running;
    collectBtn.disabled = running;
    analyzeBtn.disabled = running;
    discoverBtn.title = disabledReason("full");
    collectBtn.title = disabledReason("collect");
    analyzeBtn.title = disabledReason("analyze");
    discoverBtn.classList.toggle(
      "btn-needs-setup",
      !running && Boolean(disabledReason("full")),
    );
    collectBtn.classList.toggle(
      "btn-needs-setup",
      !running && Boolean(disabledReason("collect")),
    );
    analyzeBtn.classList.toggle(
      "btn-needs-setup",
      !running && Boolean(disabledReason("analyze")),
    );
  };

  const setRunningUi = (active: boolean, activeBtn?: HTMLButtonElement, label?: string) => {
    running = active;
    queryInput.disabled = active;
    subredditInput.disabled = active;
    if (active && activeBtn && label) {
      activeBtn.textContent = label;
    } else {
      discoverBtn.textContent = "Discover pains";
      collectBtn.textContent = "Find evidence only";
      analyzeBtn.textContent = "Analyze existing evidence";
    }
    syncButtonState();
  };

  async function runDiscoveryTask(
    kind: DiscoveryOperationKind,
    estimateSeconds: number,
    activeBtn: HTMLButtonElement,
    activeLabel: string,
    task: () => Promise<DiscoveryActionResult>,
  ): Promise<void> {
    const reason = disabledReason(kind === "analyze" ? "analyze" : kind === "collect" ? "collect" : "full");
    if (reason) {
      onFeedback(reason, false);
      return;
    }

    const operation = startDiscoveryOperation(kind, estimateSeconds);
    setRunningUi(true, activeBtn, activeLabel);
    renderInlineProgress(statusBox, operation.message, estimateSeconds, operation.startedAt);

    const tick = window.setInterval(() => {
      renderInlineProgress(
        statusBox,
        formatProgressLabel(operation),
        estimateSeconds,
        operation.startedAt,
      );
    }, 1000);

    try {
      const result = await task();
      onFeedback(result.message, result.ok);
      if (result.suggestions) {
        for (const suggestion of result.suggestions) {
          if (!suggestions.find((item) => item.subreddit === suggestion.subreddit)) {
            suggestions.push(suggestion);
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Discovery failed.";
      onFeedback(message, false);
    } finally {
      window.clearInterval(tick);
      endDiscoveryOperation();
      statusBox.hidden = true;
      setRunningUi(false);
      await onComplete();
    }
  }

  queryInput.addEventListener("input", () => {
    onPrefsChange({ query: queryInput.value, subreddits: subredditInput.value });
    syncButtonState();
  });

  subredditInput.addEventListener("input", () => {
    onPrefsChange({ query: queryInput.value, subreddits: subredditInput.value });
    syncButtonState();
  });

  analyzeBtn.addEventListener("click", () => {
    void runDiscoveryTask(
      "analyze",
      estimateAnalyzeSeconds(),
      analyzeBtn,
      "Analyzing…",
      onAnalyze,
    );
  });

  collectBtn.addEventListener("click", () => {
    const prefsNow = { query: queryInput.value, subreddits: subredditInput.value };
    void runDiscoveryTask(
      "collect",
      estimateCollectSeconds(prefsNow),
      collectBtn,
      "Finding evidence…",
      () => onCollectOnly(prefsNow),
    );
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const prefsNow = { query: queryInput.value, subreddits: subredditInput.value };
    void runDiscoveryTask(
      "full",
      estimateFullSeconds(prefsNow),
      discoverBtn,
      "Discovering…",
      () => onFullDiscovery(prefsNow),
    );
  });

  form.append(
    createLabeledFieldWithWand("Research query", queryInput, "discovery_query", {
      enabled: configured && !running,
      sessionId,
      onApplied: () => {
        onPrefsChange({ query: queryInput.value, subreddits: subredditInput.value });
        syncButtonState();
      },
    }),
    createLabeledFieldWithWand(
      "Subreddits (comma-separated)",
      subredditInput,
      "discovery_subreddits",
      {
        enabled: configured && !running,
        sessionId,
        onApplied: () => {
          onPrefsChange({ query: queryInput.value, subreddits: subredditInput.value });
          syncButtonState();
        },
      },
    ),
  );

  form.addEventListener("implemento:suggest-error", (event) => {
    onFeedback((event as CustomEvent<string>).detail, false);
  });

  const actions = document.createElement("div");
  actions.className = "button-row";
  actions.append(discoverBtn, collectBtn, analyzeBtn);
  form.append(actions);
  root.append(form);

  syncButtonState();

  if (!hasSession) {
    appendNote(root, "Create or select a research session first (section above).");
  } else if (!configured) {
    appendNote(root, "LLM not configured — Find evidence still works; Discover pains needs Settings.");
  } else if (!hasTargets()) {
    appendNote(root, "Enter a research query and/or at least one subreddit.");
  }

  const themesRoot = document.createElement("div");
  themesRoot.id = "pain-themes-list";
  renderPainThemes(themesRoot, themes, evidence);
  root.append(themesRoot);

  if (suggestions.length > 0) {
    const heading = document.createElement("h3");
    heading.textContent = "Profile suggestions";
    root.append(heading);

    const list = document.createElement("ul");
    list.className = "suggestion-list";
    for (const suggestion of suggestions) {
      const li = document.createElement("li");
      const text = document.createElement("p");
      text.textContent = `r/${suggestion.subreddit}: ${suggestion.tone ?? "updated tone"}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "secondary small";
      btn.textContent = "Apply";
      btn.addEventListener("click", () => onApplySuggestion(suggestion));
      li.append(text, btn);
      list.append(li);
    }
    root.append(list);
  }
}

function appendNote(root: HTMLElement, text: string): void {
  const note = document.createElement("p");
  note.className = "muted";
  note.textContent = text;
  root.append(note);
}

function renderPainThemes(
  root: HTMLElement,
  themes: PainTheme[],
  evidence: EvidenceItem[],
): void {
  root.replaceChildren();

  if (themes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No pain themes yet. Run Discover pains to analyze Reddit evidence.";
    root.append(empty);
    return;
  }

  const list = document.createElement("ul");
  list.className = "theme-list";

  for (const theme of themes.sort((a, b) => b.severity - a.severity)) {
    const li = document.createElement("li");
    const title = document.createElement("p");
    title.className = "theme-title";
    title.textContent = theme.title;

    const meta = document.createElement("p");
    meta.className = "theme-meta";
    meta.textContent = `Severity ${theme.severity}/10 · ${theme.frequency} · ${
      theme.inferenceFlag ? "inference" : "evidence-backed"
    }`;

    const summary = document.createElement("p");
    summary.textContent = theme.summary;

    const quotes = document.createElement("ul");
    quotes.className = "quote-list";
    for (const evidenceId of theme.evidenceIds) {
      const item = evidence.find((entry) => entry.id === evidenceId);
      if (!item) continue;
      const quoteItem = document.createElement("li");
      quoteItem.textContent = item.quote.slice(0, 180);
      quotes.append(quoteItem);
    }

    if (theme.workaroundPhrases.length > 0) {
      const workarounds = document.createElement("p");
      workarounds.className = "muted";
      workarounds.textContent = `Workarounds: ${theme.workaroundPhrases.join("; ")}`;
      li.append(workarounds);
    }

    if (theme.buyerSignals.length > 0) {
      const buyers = document.createElement("p");
      buyers.className = "muted";
      buyers.textContent = `Buyer signals: ${theme.buyerSignals.join("; ")}`;
      li.append(buyers);
    }

    li.append(title, meta, summary, quotes);
    list.append(li);
  }

  root.append(list);
}
