import type {
  ImplementoMessage,
  ImplementoResponse,
  STORAGE_UPDATED_EVENT,
} from "../shared/messages/types";
import { handleMessage } from "./handlers/messages";

import { browserStorageAdapter } from "../shared/storage/browser-storage";

chrome.runtime.onInstalled.addListener(() => {
  console.info("[Implemento] Extension installed — phase 2 discovery engine");
  void browserStorageAdapter.ensureSeedProfiles();
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => {
    console.error("[Implemento] Failed to set side panel behavior", error);
  });

chrome.runtime.onMessage.addListener(
  (
    message: ImplementoMessage | { type: typeof STORAGE_UPDATED_EVENT },
    _sender,
    sendResponse: (response: ImplementoResponse<unknown>) => void,
  ) => {
    if (message.type === "STORAGE_UPDATED") {
      return;
    }

    handleMessage(message)
      .then(sendResponse)
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : "Background handler failed.";
        sendResponse({ ok: false, error: errorMessage });
      });

    return true;
  },
);
