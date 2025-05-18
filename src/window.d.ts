import { IpcRenderer } from 'electron';

declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer;
    };
  }
}

export {}; // Ensure this file is treated as a module