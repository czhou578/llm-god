"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ````
// typescript
// filepath: c:\Users\mycol\WebProjects\llm-god\src\preload.cts
const electron_1 = require("electron"); // Use import for .cts, it will be compiled to require
// Expose ipcRenderer to the window object.
// This is possible because contextIsolation is false in your mainWindow webPreferences.
window.electron = {
    ipcRenderer: electron_1.ipcRenderer
};
window.addEventListener("DOMContentLoaded", () => {
    document.body.style.backgroundColor = "black";
});
// ````
