import { sendMessage } from "../shared/messages/client";
import { renderPostDraft } from "../shared/templates/engine";
import type { PostDraft } from "../shared/types/domain";

const MAX_SUBREDDITS = 3;

export async function loadPostDrafts(sessionId: string): Promise<PostDraft[]> {
  const response = await sendMessage<PostDraft[]>({
    type: "LIST_POST_DRAFTS",
    sessionId,
  });
  return response.ok ? (response.data ?? []) : [];
}

export async function generatePostDrafts(
  sessionId: string,
  subreddits: string[],
): Promise<{ ok: boolean; message: string }> {
  const response = await sendMessage<{ drafts: PostDraft[]; warnings: string[] }>({
    type: "GENERATE_POST_DRAFTS",
    sessionId,
    subreddits,
  });
  if (!response.ok) return { ok: false, message: response.error };
  const count = response.data?.drafts.length ?? 0;
  const warningText =
    response.data?.warnings.length ? ` Warnings: ${response.data.warnings.join("; ")}` : "";
  return {
    ok: true,
    message: `Generated ${count} post draft(s).${warningText}`,
  };
}

export function renderPostDraftMarkdown(draft: PostDraft): string {
  const date = new Date().toISOString().slice(0, 10);
  return renderPostDraft({
    subreddit: draft.subreddit,
    archetype: draft.archetype,
    created: date,
    title: draft.title,
    body: draft.body,
    risk_notes: `${draft.riskNotes}\n\nPromotional risk: ${draft.promoRisk}`,
  });
}

export function renderPostsUi(
  root: HTMLElement,
  options: {
    configured: boolean;
    hasBlueprint: boolean;
    availableSubreddits: string[];
    selectedSubreddits: string[];
    drafts: PostDraft[];
    onSelectionChange: (subreddits: string[]) => void;
    onGenerate: () => void;
    onExportDraft: (draft: PostDraft) => void;
    onExportAll: () => void;
  },
): void {
  root.replaceChildren();

  const disclaimer = document.createElement("p");
  disclaimer.className = "muted";
  disclaimer.textContent =
    "Drafts are suggestions only. Review subreddit rules before posting.";
  root.append(disclaimer);

  if (options.availableSubreddits.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Pin evidence or use seed communities to populate subreddit targets.";
    root.append(empty);
    return;
  }

  const picker = document.createElement("fieldset");
  picker.className = "subreddit-picker";
  const legend = document.createElement("legend");
  legend.textContent = `Target subreddits (max ${MAX_SUBREDDITS})`;
  picker.append(legend);

  for (const subreddit of options.availableSubreddits) {
    const label = document.createElement("label");
    label.className = "checkbox-label";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = subreddit;
    input.checked = options.selectedSubreddits.includes(subreddit);
    input.addEventListener("change", () => {
      const checked = Array.from(
        picker.querySelectorAll<HTMLInputElement>("input:checked"),
      ).map((el) => el.value);
      if (checked.length > MAX_SUBREDDITS) {
        input.checked = false;
        return;
      }
      options.onSelectionChange(checked);
    });
    label.append(input, ` r/${subreddit}`);
    picker.append(label);
  }
  root.append(picker);

  const actions = document.createElement("div");
  actions.className = "button-row";
  const generateBtn = document.createElement("button");
  generateBtn.type = "button";
  generateBtn.textContent = "Generate post drafts";
  generateBtn.disabled =
    !options.configured ||
    !options.hasBlueprint ||
    options.selectedSubreddits.length === 0;
  generateBtn.addEventListener("click", options.onGenerate);
  actions.append(generateBtn);

  if (options.drafts.length > 0) {
    const exportAllBtn = document.createElement("button");
    exportAllBtn.type = "button";
    exportAllBtn.className = "secondary";
    exportAllBtn.textContent = "Export all drafts";
    exportAllBtn.addEventListener("click", options.onExportAll);
    actions.append(exportAllBtn);
  }
  root.append(actions);

  if (!options.configured) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Configure LLM settings to generate post drafts.";
    root.append(note);
  } else if (!options.hasBlueprint) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Generate a blueprint before drafting posts.";
    root.append(note);
  }

  if (options.drafts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No post drafts yet.";
    root.append(empty);
    return;
  }

  const grouped = new Map<string, PostDraft[]>();
  for (const draft of options.drafts) {
    const list = grouped.get(draft.subreddit) ?? [];
    list.push(draft);
    grouped.set(draft.subreddit, list);
  }

  for (const [subreddit, subDrafts] of grouped) {
    const heading = document.createElement("h3");
    heading.textContent = `r/${subreddit}`;
    root.append(heading);

    for (const draft of subDrafts) {
      const card = document.createElement("article");
      card.className = "draft-card";

      const title = document.createElement("p");
      title.className = "draft-title";
      title.textContent = draft.title;

      const meta = document.createElement("p");
      meta.className = "draft-meta";
      meta.textContent = `${draft.archetype} · promo risk: ${draft.promoRisk}`;

      const badge = document.createElement("span");
      badge.className = `risk-badge risk-${draft.promoRisk}`;
      badge.textContent = `Risk: ${draft.promoRisk}`;
      meta.append(document.createTextNode(" "), badge);

      const body = document.createElement("pre");
      body.className = "artifact-preview";
      body.textContent = draft.body.slice(0, 400);

      const risks = document.createElement("p");
      risks.className = "muted";
      risks.textContent = draft.riskNotes;

      const exportBtn = document.createElement("button");
      exportBtn.type = "button";
      exportBtn.className = "secondary small";
      exportBtn.textContent = "Export draft";
      exportBtn.addEventListener("click", () => options.onExportDraft(draft));

      card.append(title, meta, body, risks, exportBtn);
      root.append(card);
    }
  }
}
