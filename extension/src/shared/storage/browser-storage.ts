import { createStorageAdapter } from "./storage-adapter";

export const browserStorageAdapter = createStorageAdapter(chrome.storage.local);
