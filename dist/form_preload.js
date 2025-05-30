"use strict";
const { contextBridge, ipcRenderer } = require('electron');
// Define the structure on the window object for TypeScript
// declare global {
//   interface Window {
//     electron: {
//       ipcRenderer: typeof ipcRenderer;
//     };
//   }
// }
// // Expose ipcRenderer to the window object.
// // This is possible because contextIsolation is false in your mainWindow webPreferences.
// window.electron = {
//   ipcRenderer: ipcRenderer,
// };
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => {
            const validChannels = ['save-prompt', 'open-form-window', 'enter-prompt', 'send-prompt'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        invoke: (channel, data) => {
            const validChannels = ['get-prompts'];
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, data);
            }
        },
        on: (channel, func) => {
            const validChannels = ['prompt-saved'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (_, ...args) => func(...args));
            }
        }
    }
});
