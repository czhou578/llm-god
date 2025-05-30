const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel: string, data: any) => {
            const validChannels = ['save-prompt', 'open-form-window', 'enter-prompt', 'send-prompt'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        invoke: (channel: string, data?: any) => {
            const validChannels = ['get-prompts'];
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, data);
            }
        },
        on: (channel: string, func: (...args: any[]) => void) => {
            const validChannels = ['prompt-saved'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (_: any, ...args: any) => func(...args));
            }
        }
    }
});