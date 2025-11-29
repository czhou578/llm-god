const { contextBridge, ipcRenderer } = require("electron");

const IPC_CHANNELS = {
  SAVE_PROMPT: 'save-prompt',
  OPEN_FORM_WINDOW: 'open-form-window',
  ENTER_PROMPT: 'enter-prompt',
  INJECT_PROMPT: 'inject-prompt',
  SEND_PROMPT: 'send-prompt',
  DELETE_PROMPT_BY_VALUE: 'delete-prompt-by-value',
  ROW_SELECTED: 'row-selected',
  PASTE_PROMPT: 'paste-prompt',
  UPDATE_PROMPT: 'update-prompt',
  EDIT_PROMPT_READY: 'edit-prompt-ready',
  CLOSE_FORM_WINDOW: 'close-form-window',
  OPEN_EDIT_VIEW: 'open-edit-view',
  CLOSE_EDIT_WINDOW: 'close-edit-window',
  OPEN_CLAUDE: 'open-claude',
  CLOSE_CLAUDE: 'close-claude',
  OPEN_DEEPSEEK: 'open-deepseek',
  CLOSE_DEEPSEEK: 'close-deepseek',
  OPEN_GROK: 'open-grok',
  CLOSE_GROK: 'close-grok',
  OPEN_COPILOT: 'open-copilot',
  CLOSE_COPILOT: 'close-copilot',
  OPEN_CHATGPT: 'open-chatgpt',
  CLOSE_CHATGPT: 'close-chatgpt',
  OPEN_GEMINI: 'open-gemini',
  CLOSE_GEMINI: 'close-gemini',
  OPEN_LM_ARENA: 'open-lm-arena',
  CLOSE_LM_ARENA: 'close-lm-arena',
  OPEN_MODEL_SELECTION_WINDOW: 'open-model-selection-window',
  CLOSE_MODEL_SELECTION_WINDOW: 'close-model-selection-window',
  SAVE_DEFAULT_MODELS: 'save-default-models',
  CONTENT_COPIED: 'content-copied',
  NEW_CHAT: 'new-chat',
  GET_PROMPTS: 'get-prompts',
  GET_KEY_BY_VALUE: 'get-key-by-value',
  GET_DEFAULT_MODELS: 'get-default-models',
  GET_OPEN_VIEWS: 'get-open-views',
  PROMPT_SAVED: 'prompt-saved',
  ON_SELECTED: 'on-selected',
  REFRESH_PROMPT_TABLE: 'refresh-prompt-table',
};

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
