"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electron", {
    ipcRenderer: {
        send: (channel, data) => {
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
                electron_1.ipcRenderer.send(channel, data);
            }
        },
        invoke: (channel, data) => {
            const validChannels = ["get-prompts", "get-key-by-value"];
            if (validChannels.includes(channel)) {
                return electron_1.ipcRenderer.invoke(channel, data);
            }
        },
        on: (channel, func) => {
            const validChannels = [
                "prompt-saved",
                "on-selected",
                "row-selected",
                "refresh-prompt-table",
            ];
            if (validChannels.includes(channel)) {
                electron_1.ipcRenderer.on(channel, (_, ...args) => func(...args));
            }
        },
    },
});
