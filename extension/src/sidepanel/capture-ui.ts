import type { EvidenceItem } from "../shared/types/domain";
import type { PageContext, ParsedComment } from "../shared/reddit/types";
import {
  isPostPageContext,
  isProfilePageContext,
  isSearchPageContext,
  isSubredditPageContext,
} from "../shared/reddit/types";
import { sendMessage } from "../shared/messages/client";
import {
  fetchPageContext,
  loadEvidence,
  removeEvidenceItem,
} from "./session-ui";

export interface CaptureUiState {
  pageContext: PageContext | null;
  pageError: string | null;
  evidence: EvidenceItem[];
  activeSessionId: string | null;
}

export function setFeedback(elementId: string, message: string): void {
  const el = document.getElementById(elementId);
  if (el) el.textContent = message;
}

export function renderPageCard(root: HTMLElement, state: CaptureUiState): void {
  root.replaceChildren();

  if (state.pageError) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = state.pageError;
    root.append(p);
    return;
  }

  if (!state.pageContext) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Open a Reddit tab to capture context.";
    root.append(p);
    return;
  }

  const ctx = state.pageContext;
  const lines = [
    `Type: ${ctx.pageType}`,
    `Subreddit: ${ctx.subreddit ? `r/${ctx.subreddit}` : "—"}`,
  ];

  if (isPostPageContext(ctx)) {
    lines.push(`Title: ${ctx.post.title}`);
    if (ctx.post.body) {
      const excerpt = ctx.post.body.slice(0, 160);
      lines.push(`Body: ${excerpt}${ctx.post.body.length > 160 ? "…" : ""}`);
    }
  } else if (isSubredditPageContext(ctx)) {
    lines.push(`Name: r/${ctx.subredditInfo.name}`);
    if (ctx.subredditInfo.description) {
      lines.push(`About: ${ctx.subredditInfo.description.slice(0, 120)}`);
    }
  } else if (isSearchPageContext(ctx)) {
    lines.push(`Query: ${ctx.search.query || "—"}`);
    lines.push(`Results: ${ctx.search.results.length}`);
  } else if (isProfilePageContext(ctx)) {
    lines.push(`User: u/${ctx.profile.username}`);
  }

  for (const line of lines) {
    const p = document.createElement("p");
    p.textContent = line;
    root.append(p);
  }

  if (ctx.warnings.length > 0) {
    const warn = document.createElement("p");
    warn.className = "warning";
    warn.textContent = `Warnings: ${ctx.warnings.join(", ")}`;
    root.append(warn);
  }
}

export function renderEvidenceList(root: HTMLElement, evidence: EvidenceItem[]): void {
  root.replaceChildren();

  if (evidence.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No evidence pinned yet.";
    root.append(p);
    return;
  }

  const list = document.createElement("ul");
  list.className = "evidence-list";

  for (const item of evidence) {
    const li = document.createElement("li");

    const meta = document.createElement("p");
    meta.className = "evidence-meta";
    meta.textContent = `${item.type} · r/${item.subreddit}`;

    const quote = document.createElement("p");
    quote.className = "evidence-quote";
    quote.textContent = item.quote;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "secondary small";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", async () => {
      const removed = await removeEvidenceItem(item.id);
      if (removed) {
        setFeedback("capture-feedback", "Evidence removed.");
        document.dispatchEvent(new CustomEvent("implemento:refresh"));
      }
    });

    li.append(meta, quote, removeBtn);
    list.append(li);
  }

  root.append(list);
}

export async function pinPost(
  sessionId: string,
  context: PageContext,
): Promise<string> {
  if (!isPostPageContext(context)) {
    return "Open a Reddit post thread to pin the post.";
  }

  const quote = [context.post.title, context.post.body].filter(Boolean).join("\n\n");
  const response = await sendMessage<{ evidence: EvidenceItem; duplicate: boolean }>({
    type: "PIN_EVIDENCE",
    evidence: {
      sessionId,
      redditUrl: context.post.permalink || context.url,
      subreddit: context.post.subreddit || context.subreddit,
      quote,
      type: "post",
      tags: context.post.flair ? [context.post.flair] : [],
    },
  });

  if (!response.ok) return response.error;
  return response.data?.duplicate
    ? "Post already pinned."
    : "Post pinned to session.";
}

export async function pinSelection(sessionId: string, context: PageContext): Promise<string> {
  const selection = await sendMessage<{ text: string }>({ type: "GET_SELECTION" });
  if (!selection.ok) {
    return selection.error ?? "Select text on the Reddit page first.";
  }
  if (!selection.data?.text) {
    return "Select text on the Reddit page first.";
  }

  const response = await sendMessage<{ evidence: EvidenceItem; duplicate: boolean }>({
    type: "PIN_EVIDENCE",
    evidence: {
      sessionId,
      redditUrl: context.url,
      subreddit: context.subreddit,
      quote: selection.data.text,
      type: "comment",
      tags: ["selection"],
    },
  });

  if (!response.ok) return response.error;
  return response.data?.duplicate
    ? "Selection already pinned."
    : "Selection pinned to session.";
}

export async function pinComment(
  sessionId: string,
  context: PageContext,
  commentId: string,
): Promise<string> {
  if (!isPostPageContext(context)) return "No comments on this page.";

  const comment = context.post.comments.find((c: ParsedComment) => c.id === commentId);
  if (!comment) return "Comment not found.";

  const response = await sendMessage<{ evidence: EvidenceItem; duplicate: boolean }>({
    type: "PIN_EVIDENCE",
    evidence: {
      sessionId,
      redditUrl: comment.permalink || context.post.permalink || context.url,
      subreddit: context.post.subreddit || context.subreddit,
      quote: comment.body,
      type: "comment",
      tags: [`author:${comment.author}`],
    },
  });

  if (!response.ok) return response.error;
  return response.data?.duplicate ? "Comment already pinned." : "Comment pinned.";
}

export async function pinManualEvidence(
  sessionId: string,
  input: {
    quote: string;
    redditUrl: string;
    subreddit: string;
    type: EvidenceItem["type"];
  },
): Promise<string> {
  if (!input.quote.trim()) return "Quote is required.";

  const response = await sendMessage<{ evidence: EvidenceItem; duplicate: boolean }>({
    type: "PIN_EVIDENCE",
    evidence: {
      sessionId,
      redditUrl: input.redditUrl || "manual://paste",
      subreddit: input.subreddit.replace(/^r\//i, ""),
      quote: input.quote,
      type: input.type,
      tags: ["manual"],
    },
  });

  if (!response.ok) return response.error;
  return response.data?.duplicate ? "Evidence already exists." : "Manual evidence pinned.";
}

export function renderCommentPinButtons(
  root: HTMLElement,
  state: CaptureUiState,
  onPin: (commentId: string) => void,
): void {
  root.replaceChildren();
  if (!isPostPageContext(state.pageContext)) return;

  const heading = document.createElement("h3");
  heading.textContent = "Visible comments";
  root.append(heading);

  const list = document.createElement("ul");
  list.className = "comment-list";

  for (const comment of state.pageContext.post.comments) {
    const li = document.createElement("li");
    const excerpt = comment.body.slice(0, 100);
    const label = document.createElement("p");
    label.textContent = `u/${comment.author}: ${excerpt}${comment.body.length > 100 ? "…" : ""}`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "secondary small";
    btn.textContent = "Pin comment";
    btn.addEventListener("click", () => onPin(comment.id));

    li.append(label, btn);
    list.append(li);
  }

  root.append(list);
}

export async function refreshPageContext(): Promise<{
  context: PageContext | null;
  error: string | null;
}> {
  const context = await fetchPageContext(true);
  if (context) return { context, error: null };
  return {
    context: null,
    error: "Open a Reddit tab or refresh the page, then try again.",
  };
}

export async function refreshEvidence(sessionId: string | null): Promise<EvidenceItem[]> {
  if (!sessionId) return [];
  return loadEvidence(sessionId);
}
