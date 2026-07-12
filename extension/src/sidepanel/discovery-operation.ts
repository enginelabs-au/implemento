export interface DiscoveryPrefs {
  query: string;
  subreddits: string;
}

export type DiscoveryOperationKind = "collect" | "full" | "analyze";

export interface DiscoveryOperationState {
  kind: DiscoveryOperationKind;
  message: string;
  estimateSeconds: number;
  startedAt: number;
}

let activeOperation: DiscoveryOperationState | null = null;
let progressTimer: ReturnType<typeof setInterval> | null = null;
let onProgressTick: ((state: DiscoveryOperationState) => void) | null = null;

export function getDiscoveryOperation(): DiscoveryOperationState | null {
  return activeOperation;
}

export function isDiscoveryBusy(): boolean {
  return activeOperation !== null;
}

function countSources(prefs: DiscoveryPrefs): number {
  const query = prefs.query.trim() ? 1 : 0;
  const subs = prefs.subreddits
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;
  return Math.max(1, query + subs);
}

export function estimateCollectSeconds(prefs: DiscoveryPrefs): number {
  return countSources(prefs) * 28 + 12;
}

export function estimateFullSeconds(prefs: DiscoveryPrefs): number {
  return estimateCollectSeconds(prefs) + 50;
}

export function estimateAnalyzeSeconds(): number {
  return 35;
}

function defaultMessage(kind: DiscoveryOperationKind): string {
  switch (kind) {
    case "collect":
      return "Searching Reddit and collecting evidence…";
    case "full":
      return "Searching Reddit, then analyzing pain themes…";
    case "analyze":
      return "Analyzing pinned evidence with LLM…";
  }
}

export function startDiscoveryOperation(
  kind: DiscoveryOperationKind,
  estimateSeconds: number,
  message = defaultMessage(kind),
): DiscoveryOperationState {
  activeOperation = {
    kind,
    message,
    estimateSeconds,
    startedAt: Date.now(),
  };
  return activeOperation;
}

export function endDiscoveryOperation(): void {
  activeOperation = null;
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

export function formatRemainingSeconds(totalSeconds: number, startedAt: number): number {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, totalSeconds - elapsed);
}

export function formatProgressLabel(state: DiscoveryOperationState): string {
  const remaining = formatRemainingSeconds(state.estimateSeconds, state.startedAt);
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  const eta =
    remaining > 0
      ? `~${remaining}s remaining`
      : elapsed > state.estimateSeconds + 15
        ? "Taking longer than expected…"
        : "Finishing up…";
  return `${state.message} ${eta}`;
}

export function watchDiscoveryProgress(onTick: (state: DiscoveryOperationState) => void): void {
  onProgressTick = onTick;
  if (progressTimer) clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (!activeOperation || !onProgressTick) return;
    onProgressTick(activeOperation);
  }, 1000);
}

export function unwatchDiscoveryProgress(): void {
  onProgressTick = null;
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

export function renderDiscoveryProgress(
  root: HTMLElement | null,
  state: DiscoveryOperationState | null,
): void {
  if (!root) return;
  root.replaceChildren();

  if (!state) return;

  const card = document.createElement("div");
  card.className = "discovery-progress";
  card.setAttribute("role", "status");
  card.setAttribute("aria-live", "polite");

  const row = document.createElement("div");
  row.className = "discovery-progress-row";

  const spinner = document.createElement("span");
  spinner.className = "discovery-spinner";
  spinner.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.className = "discovery-progress-text";
  text.textContent = formatProgressLabel(state);

  row.append(spinner, text);
  card.append(row);

  const bar = document.createElement("div");
  bar.className = "discovery-progress-bar";
  const fill = document.createElement("div");
  fill.className = "discovery-progress-fill";
  const elapsed = Date.now() - state.startedAt;
  const pct = Math.min(95, (elapsed / (state.estimateSeconds * 1000)) * 100);
  fill.style.width = `${pct}%`;
  bar.append(fill);
  card.append(bar);

  root.append(card);
}
