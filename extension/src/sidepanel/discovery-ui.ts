import type { CommunityProfile, CommunityProfileSuggestion } from "../shared/types/domain";
import type { EvidenceItem, PainTheme } from "../shared/types/domain";
import { sendMessage } from "../shared/messages/client";

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
  onFeedback: (message: string) => void,
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

    const tone = createEditableField("Tone", profile.tone, "tone");
    const rules = createEditableField("Rules notes", profile.rulesNotes, "rules");
    const promo = createEditableField("Promo policy", profile.promoPolicy, "promo");
    const patterns = createEditableField(
      "Post patterns (comma-separated)",
      profile.postPatterns.join(", "),
      "patterns",
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
      onFeedback(message);
    });

    details.append(tone.label, rules.label, promo.label, patterns.label, saveBtn);
    root.append(details);
  }
}

function createEditableField(
  labelText: string,
  value: string,
  _key: string,
): { label: HTMLLabelElement; input: HTMLInputElement } {
  const label = document.createElement("label");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  label.append(input);
  return { label, input };
}

export async function loadPainThemes(sessionId: string): Promise<PainTheme[]> {
  const response = await sendMessage<PainTheme[]>({
    type: "LIST_PAIN_THEMES",
    sessionId,
  });
  return response.ok ? (response.data ?? []) : [];
}

export async function runDiscovery(sessionId: string): Promise<{
  ok: boolean;
  message: string;
  suggestions: CommunityProfileSuggestion[];
}> {
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

export function renderDiscoveryUi(
  root: HTMLElement,
  themes: PainTheme[],
  evidence: EvidenceItem[],
  suggestions: CommunityProfileSuggestion[],
  configured: boolean,
  hasEvidence: boolean,
  onAnalyze: () => void,
  onApplySuggestion: (suggestion: CommunityProfileSuggestion) => void,
): void {
  root.replaceChildren();

  const analyzeBtn = document.createElement("button");
  analyzeBtn.type = "button";
  analyzeBtn.id = "analyze-session";
  analyzeBtn.textContent = "Analyze session";
  analyzeBtn.disabled = !configured || !hasEvidence;
  analyzeBtn.addEventListener("click", onAnalyze);
  root.append(analyzeBtn);

  if (!configured) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Configure LLM settings to analyze pinned evidence.";
    root.append(note);
  } else if (!hasEvidence) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Pin evidence to this session before analyzing.";
    root.append(note);
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

function renderPainThemes(
  root: HTMLElement,
  themes: PainTheme[],
  evidence: EvidenceItem[],
): void {
  root.replaceChildren();

  if (themes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No pain themes yet. Run analysis on pinned evidence.";
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
