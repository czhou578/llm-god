"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = [
        "save-prompt",
        "open-form-window",
        "enter-prompt",
        "inject-prompt",
        "send-prompt",
<<<<<<< HEAD
        "delete-prompt-by-value",
        "row-selected",
        "paste-prompt",
        "update-prompt",
        "edit-prompt-ready",
        "close-form-window",
        "open-edit-view",
        "close-edit-window",
=======
        "paste-prompt",
        "close-form-window",
>>>>>>> 2e7534e3c76de91b9f9e78aa7efcc5f887493d02
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
    invoke: (channel, data) => {
<<<<<<< HEAD
      const validChannels = ["get-prompts", "get-key-by-value"];
=======
      const validChannels = ["get-prompts"];
>>>>>>> 2e7534e3c76de91b9f9e78aa7efcc5f887493d02
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
    },
    on: (channel, func) => {
<<<<<<< HEAD
      const validChannels = [
        "prompt-saved",
        "on-selected",
        "row-selected",
        "refresh-prompt-table",
      ];
=======
      const validChannels = ["prompt-saved"];
>>>>>>> 2e7534e3c76de91b9f9e78aa7efcc5f887493d02
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (_, ...args) => func(...args));
      }
    },
  },
});
