import { sendMessage } from "../shared/messages/client";
import type { Blueprint, PhasePlan } from "../shared/types/domain";

export async function loadBlueprint(sessionId: string): Promise<Blueprint | null> {
  const response = await sendMessage<Blueprint | null>({
    type: "GET_BLUEPRINT",
    sessionId,
  });
  return response.ok ? (response.data ?? null) : null;
}

export async function loadPhase0Plan(sessionId: string): Promise<PhasePlan | null> {
  const response = await sendMessage<PhasePlan | null>({
    type: "GET_PHASE_PLAN",
    sessionId,
    phaseNumber: 0,
  });
  return response.ok ? (response.data ?? null) : null;
}

export async function generateBlueprint(
  sessionId: string,
  projectTitle?: string,
): Promise<{ ok: boolean; message: string; blueprint: Blueprint | null }> {
  const response = await sendMessage<Blueprint>({
    type: "GENERATE_BLUEPRINT",
    sessionId,
    projectTitle,
  });
  if (!response.ok) {
    return { ok: false, message: response.error, blueprint: null };
  }
  return {
    ok: true,
    message: `Blueprint generated (v${response.data?.version ?? 1}).`,
    blueprint: response.data ?? null,
  };
}

export async function generatePhase0(
  sessionId: string,
): Promise<{ ok: boolean; message: string; plan: PhasePlan | null }> {
  const response = await sendMessage<PhasePlan>({
    type: "GENERATE_PHASE0",
    sessionId,
  });
  if (!response.ok) {
    return { ok: false, message: response.error, plan: null };
  }
  return {
    ok: true,
    message: "Phase 0 plan generated.",
    plan: response.data ?? null,
  };
}

export async function markPhase0Complete(sessionId: string): Promise<string> {
  const response = await sendMessage<PhasePlan>({
    type: "MARK_PHASE_PLAN_STATUS",
    sessionId,
    phaseNumber: 0,
    status: "complete",
  });
  return response.ok ? "Phase 0 marked complete." : response.error;
}

function previewMarkdown(markdown: string, maxLength = 600): string {
  if (markdown.length <= maxLength) return markdown;
  return `${markdown.slice(0, maxLength)}…`;
}

import { createLabeledFieldWithWand } from "./suggest-ui";

export function renderPlanningUi(
  root: HTMLElement,
  options: {
    configured: boolean;
    hasThemes: boolean;
    sessionId: string | null;
    projectTitle: string;
    blueprint: Blueprint | null;
    phase0: PhasePlan | null;
    onProjectTitleChange: (value: string) => void;
    onGenerateBlueprint: () => void;
    onGeneratePhase0: () => void;
    onExportBlueprint: () => void;
    onExportPhase0: () => void;
    onMarkPhase0Complete: () => void;
  },
): void {
  root.replaceChildren();

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.id = "project-title";
  titleInput.value = options.projectTitle;
  titleInput.placeholder = "Defaults to session name";
  titleInput.addEventListener("input", () => {
    options.onProjectTitleChange(titleInput.value);
  });
  const titleField = createLabeledFieldWithWand("Project title", titleInput, "project_title", {
    enabled: options.configured,
    sessionId: options.sessionId,
    onApplied: () => options.onProjectTitleChange(titleInput.value),
  });
  titleField.addEventListener("implemento:suggest-error", () => {
    // Parent can surface via planning-feedback if wired later.
  });
  root.append(titleField);

  const actions = document.createElement("div");
  actions.className = "button-row";

  const blueprintBtn = document.createElement("button");
  blueprintBtn.type = "button";
  blueprintBtn.textContent = "Generate blueprint";
  blueprintBtn.disabled = !options.configured || !options.hasThemes;
  blueprintBtn.addEventListener("click", options.onGenerateBlueprint);
  actions.append(blueprintBtn);

  const phase0Btn = document.createElement("button");
  phase0Btn.type = "button";
  phase0Btn.className = "secondary";
  phase0Btn.textContent = "Generate phase 0";
  phase0Btn.disabled = !options.configured || !options.blueprint;
  phase0Btn.addEventListener("click", options.onGeneratePhase0);
  actions.append(phase0Btn);

  root.append(actions);

  if (!options.configured) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Configure LLM settings to generate planning artifacts.";
    root.append(note);
  } else if (!options.hasThemes) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Run discovery to produce pain themes before planning.";
    root.append(note);
  }

  if (options.blueprint) {
    const card = document.createElement("article");
    card.className = "artifact-card";
    const heading = document.createElement("h3");
    heading.textContent = `Blueprint v${options.blueprint.version}`;
    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = `Created ${options.blueprint.createdAt.slice(0, 10)} · sections valid`;
    const preview = document.createElement("pre");
    preview.className = "artifact-preview";
    preview.textContent = previewMarkdown(options.blueprint.markdown);
    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "secondary small";
    exportBtn.textContent = "Export blueprint";
    exportBtn.addEventListener("click", options.onExportBlueprint);
    card.append(heading, meta, preview, exportBtn);
    root.append(card);
  }

  if (options.phase0) {
    const card = document.createElement("article");
    card.className = "artifact-card";
    const heading = document.createElement("h3");
    heading.textContent = `Phase 0 plan (${options.phase0.status})`;
    const preview = document.createElement("pre");
    preview.className = "artifact-preview";
    preview.textContent = previewMarkdown(options.phase0.markdown);
    const row = document.createElement("div");
    row.className = "button-row";
    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "secondary small";
    exportBtn.textContent = "Export phase 0";
    exportBtn.addEventListener("click", options.onExportPhase0);
    const completeBtn = document.createElement("button");
    completeBtn.type = "button";
    completeBtn.className = "small";
    completeBtn.textContent = "Mark phase 0 complete";
    completeBtn.disabled = options.phase0.status === "complete";
    completeBtn.addEventListener("click", options.onMarkPhase0Complete);
    row.append(exportBtn, completeBtn);
    card.append(heading, preview, row);
    root.append(card);
  }
}
