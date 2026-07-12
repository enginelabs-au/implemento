import type {
  ImplementoMessage,
  ImplementoResponse,
} from "../shared/messages/types";
import {
  supplementPostFromJson,
  type RedditListingResponse,
} from "../shared/reddit/parsers/post";
import { parsePageContext } from "../shared/reddit/parsers";
import { detectPageTypeFromUrl } from "../shared/reddit/page-detector";
import { isPostPageContext } from "../shared/reddit/types";
import type { PageContext } from "../shared/reddit/types";
import { sanitizeText } from "../shared/reddit/sanitize";

async function buildPageContext(
  useJsonFallback: boolean,
): Promise<ImplementoResponse<PageContext>> {
  try {
    let context = parsePageContext(document, location.href);

    if (
      useJsonFallback &&
      isPostPageContext(context) &&
      (context.warnings.includes("body_not_found") || !context.post.body)
    ) {
      const supplemented = await tryJsonFallback(context);
      if (supplemented) context = supplemented;
    }

    return { ok: true, data: context };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse page.";
    return { ok: false, error: message };
  }
}

async function tryJsonFallback(context: PageContext): Promise<PageContext | null> {
  if (!isPostPageContext(context)) return null;
  try {
    const jsonUrl = location.pathname.replace(/\/?$/, ".json");
    const response = await fetch(jsonUrl);
    if (!response.ok) return null;
    const json = (await response.json()) as RedditListingResponse;
    const post = supplementPostFromJson(context.post, json);
    return {
      ...context,
      post,
      warnings: context.warnings.filter((w) => w !== "body_not_found"),
    };
  } catch {
    return null;
  }
}

function getSelectionText(): ImplementoResponse<{ text: string }> {
  const selection = window.getSelection();
  const text = sanitizeText(selection?.toString() ?? "");
  if (!text) {
    return { ok: false, error: "No text selected on the page." };
  }
  return { ok: true, data: { text } };
}

chrome.runtime.onMessage.addListener(
  (
    message: ImplementoMessage,
    _sender,
    sendResponse: (response: ImplementoResponse<unknown>) => void,
  ) => {
    if (message.type === "GET_PAGE_CONTEXT") {
      buildPageContext(Boolean(message.useJsonFallback)).then(sendResponse);
      return true;
    }

    if (message.type === "GET_SELECTION") {
      sendResponse(getSelectionText());
      return;
    }

    return;
  },
);

console.info(
  "[Implemento] Content script ready on",
  detectPageTypeFromUrl(location.href),
  location.href,
);
