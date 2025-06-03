const { contextBridge, ipcRenderer } = require("electron");

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
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    invoke: (channel: string, data?: any) => {
      const validChannels = ["get-prompts", "get-key-by-value"];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = ["prompt-saved", "on-selected", "row-selected"];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (_: any, ...args: any) => func(...args));
      }
    },
  },
});
