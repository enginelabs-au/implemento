import type { EvidenceItem, ResearchSession } from "../shared/types/domain";
import type { PageContext } from "../shared/reddit/types";
import { sendMessage } from "../shared/messages/client";
import { STORAGE_UPDATED_EVENT } from "../shared/messages/types";

import { createLabeledFieldWithWand } from "./suggest-ui";

export interface SessionUiCallbacks {
  llmConfigured?: boolean;
  onFeedback: (message: string) => void;
}

export async function loadSessions(): Promise<ResearchSession[]> {
  const response = await sendMessage<ResearchSession[]>({ type: "LIST_SESSIONS" });
  return response.ok ? (response.data ?? []) : [];
}

export async function loadActiveSession(): Promise<ResearchSession | null> {
  const response = await sendMessage<{ session: ResearchSession | null }>({
    type: "GET_ACTIVE_SESSION",
  });
  return response.ok ? (response.data?.session ?? null) : null;
}

export async function createSession(name: string): Promise<ResearchSession | null> {
  const response = await sendMessage<ResearchSession>({
    type: "CREATE_SESSION",
    name,
  });
  return response.ok ? (response.data ?? null) : null;
}

export async function setActiveSession(sessionId: string): Promise<boolean> {
  const response = await sendMessage({ type: "SET_ACTIVE_SESSION", sessionId });
  return response.ok;
}

export function renderSessionControls(
  root: HTMLElement,
  sessions: ResearchSession[],
  activeSession: ResearchSession | null,
  callbacks: SessionUiCallbacks,
): void {
  root.replaceChildren();

  const label = document.createElement("label");
  label.htmlFor = "session-select";
  label.textContent = "Active session";
  root.append(label);

  const select = document.createElement("select");
  select.id = "session-select";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = sessions.length ? "Select session…" : "No sessions yet";
  select.append(empty);

  for (const session of sessions) {
    const option = document.createElement("option");
    option.value = session.id;
    option.textContent = session.name;
    if (activeSession?.id === session.id) option.selected = true;
    select.append(option);
  }

  select.addEventListener("change", async () => {
    if (!select.value) return;
    const ok = await setActiveSession(select.value);
    callbacks.onFeedback(ok ? "Session activated." : "Failed to activate session.");
    document.dispatchEvent(new CustomEvent("implemento:refresh"));
  });

  root.append(select);

  const createRow = document.createElement("div");
  createRow.className = "row";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "New session name";
  input.id = "new-session-name";
  input.setAttribute("aria-label", "New session name");

  const createBtn = document.createElement("button");
  createBtn.type = "button";
  createBtn.textContent = "Create";
  createBtn.className = "secondary";
  createBtn.addEventListener("click", async () => {
    const name = input.value.trim() || `Session ${new Date().toLocaleDateString()}`;
    const session = await createSession(name);
    if (session) {
      input.value = "";
      callbacks.onFeedback(`Created "${session.name}".`);
      document.dispatchEvent(new CustomEvent("implemento:refresh"));
    } else {
      callbacks.onFeedback("Failed to create session.");
    }
  });

  const nameField = createLabeledFieldWithWand("New session", input, "session_name", {
    enabled: callbacks.llmConfigured ?? false,
    onApplied: () => callbacks.onFeedback("Session name suggestion applied."),
  });
  nameField.addEventListener("implemento:suggest-error", (event) => {
    callbacks.onFeedback((event as CustomEvent<string>).detail);
  });

  createRow.append(createBtn);
  root.append(nameField, createRow);
}

export function listenForStorageUpdates(onUpdate: () => void): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === STORAGE_UPDATED_EVENT) onUpdate();
  });
  document.addEventListener("implemento:refresh", onUpdate);
}

export async function loadEvidence(sessionId: string): Promise<EvidenceItem[]> {
  const response = await sendMessage<EvidenceItem[]>({
    type: "LIST_EVIDENCE",
    sessionId,
  });
  return response.ok ? (response.data ?? []) : [];
}

export async function removeEvidenceItem(evidenceId: string): Promise<boolean> {
  const response = await sendMessage({
    type: "REMOVE_EVIDENCE",
    evidenceId,
  });
  return response.ok;
}

export async function fetchPageContext(useJsonFallback = false): Promise<PageContext | null> {
  const response = await sendMessage<PageContext>({
    type: "GET_PAGE_CONTEXT",
    useJsonFallback,
  });
  return response.ok ? (response.data ?? null) : null;
}
