import { ipcRenderer } from "electron"; // Use import for .cts, it will be compiled to require

// Define the structure on the window object for TypeScript
declare global {
  interface Window {
    electron: {
      ipcRenderer: typeof ipcRenderer;
    };
  }
}

// Expose ipcRenderer to the window object.
// This is possible because contextIsolation is false in your mainWindow webPreferences.
window.electron = {
  ipcRenderer: ipcRenderer,
};

window.addEventListener("DOMContentLoaded", () => {
  document.body.style.backgroundColor = "black";
});
