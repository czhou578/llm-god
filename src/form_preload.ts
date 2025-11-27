import { IPC_CHANNELS } from "./constants";
const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel: string, data: any) => {
      const validChannels = [
        IPC_CHANNELS.SAVE_PROMPT,
        IPC_CHANNELS.OPEN_FORM_WINDOW,
        IPC_CHANNELS.ENTER_PROMPT,
        IPC_CHANNELS.INJECT_PROMPT,
        IPC_CHANNELS.SEND_PROMPT,
        IPC_CHANNELS.DELETE_PROMPT_BY_VALUE,
        IPC_CHANNELS.ROW_SELECTED,
        IPC_CHANNELS.PASTE_PROMPT,
        IPC_CHANNELS.UPDATE_PROMPT,
        IPC_CHANNELS.EDIT_PROMPT_READY,
        IPC_CHANNELS.CLOSE_FORM_WINDOW,
        IPC_CHANNELS.OPEN_EDIT_VIEW,
        IPC_CHANNELS.CLOSE_EDIT_WINDOW,
        IPC_CHANNELS.OPEN_CLAUDE,
        IPC_CHANNELS.CLOSE_CLAUDE,
        IPC_CHANNELS.OPEN_DEEPSEEK,
        IPC_CHANNELS.CLOSE_DEEPSEEK,
        IPC_CHANNELS.OPEN_GROK,
        IPC_CHANNELS.CLOSE_GROK,
        IPC_CHANNELS.OPEN_LM_ARENA,
        IPC_CHANNELS.CLOSE_LM_ARENA,
      ];
      if (validChannels.includes(channel as any)) {
        ipcRenderer.send(channel, data);
      }
    },
    invoke: (channel: string, data?: any) => {
      const validChannels = [IPC_CHANNELS.GET_PROMPTS, IPC_CHANNELS.GET_KEY_BY_VALUE];
      if (validChannels.includes(channel as any)) {
        return ipcRenderer.invoke(channel, data);
      }
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = [
        IPC_CHANNELS.PROMPT_SAVED,
        IPC_CHANNELS.ON_SELECTED,
        IPC_CHANNELS.ROW_SELECTED,
        IPC_CHANNELS.REFRESH_PROMPT_TABLE,
      ];
      if (validChannels.includes(channel as any)) {
        ipcRenderer.on(channel, (_: any, ...args: any) => func(...args));
      }
    },
  },
});
