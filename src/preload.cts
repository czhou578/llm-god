// Use require for compatibility with all Electron contexts
const { contextBridge, ipcRenderer } = require("electron");

// Define the structure on the window object for TypeScript
declare global {
  interface Window {
    electron: {
      ipcRenderer: typeof ipcRenderer;
      view_ipcRenderer?: any;
    };
  }
}

// Simple check: if contextBridge exists and we can't directly access window,
// we're in context isolation mode
const canAccessWindow = (() => {
  try {
    return typeof window !== "undefined";
  } catch (e) {
    return false;
  }
})();

const hasContextBridge = typeof contextBridge !== "undefined";

if (hasContextBridge && canAccessWindow) {
  // We're in context isolation mode (secure contexts)
  // Default to form functionality, let the URL detection happen at runtime
  contextBridge.exposeInMainWorld("electron", {
    ipcRenderer: {
      send: (channel: string, data: any) => {
        const validChannels = [
          "save-prompt",
          "open-form-window",
          "enter-prompt",
          "inject-prompt",
          "send-prompt",
          "delete-prompt-by-value",
          "row-selected",
          "paste-prompt",
          "update-prompt",
          "edit-prompt-ready",
          "close-form-window",
          "open-edit-view",
          "close-edit-window",
          "open-claude",
          "close-claude",
          "open-deepseek",
          "close-deepseek",
          "open-grok",
          "close-grok",
          "open-copilot",
          "close-copilot",
          "open-chatgpt",
          "close-chatgpt",
          "open-gemini",
          "close-gemini",
          "open-lm-arena",
          "close-lm-arena",
          "open-model-selection-window",
          "close-model-selection-window",
          "save-default-models",
          "content-copied", // Add this for view contexts too
          "paste-image",
          "new-chat",
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
        }
      },
      invoke: (channel: string, data?: any) => {
        const validChannels = [
          "get-prompts",
          "get-key-by-value",
          "get-default-models",
          "get-open-views",
        ];
        if (validChannels.includes(channel)) {
          return ipcRenderer.invoke(channel, data);
        }
      },
      on: (channel: string, func: (...args: any[]) => void) => {
        const validChannels = [
          "prompt-saved",
          "on-selected",
          "row-selected",
          "refresh-prompt-table",
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.on(channel, (_: any, ...args: any) => func(...args));
        }
      },
    },
    // Also expose view_ipcRenderer for external sites
    view_ipcRenderer: {
      send: (channel: string, data?: any) => {
        const validChannels = ["content-copied"];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
        }
      },
    },
  });
} else {
  // We're in non-isolated context (main window)
  window.electron = {
    ipcRenderer: ipcRenderer,
  };

  window.addEventListener("DOMContentLoaded", () => {
    document.body.style.backgroundColor = "black";
  });
}
