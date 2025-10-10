"use strict";
// Use require and assign to unique variable names to avoid conflicts in a bundle.
const { contextBridge: view_contextBridge, ipcRenderer: view_ipcRenderer } = require("electron");
// Expose a secure API to the renderer process (the website)
view_contextBridge.exposeInMainWorld("electron", {
    view_ipcRenderer: {
        send: (channel, data) => {
            const validChannels = [
                "content-copied",
            ];
            if (validChannels.includes(channel)) {
                view_ipcRenderer.send(channel, data);
            }
        },
    },
});
