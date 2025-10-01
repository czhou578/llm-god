import { app, BrowserWindow, ipcMain, WebContentsView, clipboard, } from "electron";
import * as remote from "@electron/remote/main/index.js";
import path from "path";
import electronLocalShortcut from "electron-localshortcut";
import { addBrowserView, removeBrowserView, injectPromptIntoView, sendPromptInView, stripEmojis, // Add this import
 } from "./utilities.js"; // Adjusted path
import { createRequire } from "node:module"; // Import createRequire
import { fileURLToPath } from "node:url"; // Import fileURLToPath
import Store from "electron-store"; // Import electron-store
import fs from 'fs'; // Import fs for file operations
const require = createRequire(import.meta.url);
const store = new Store(); // Create an instance of electron-store
if (require("electron-squirrel-startup"))
    app.quit();
remote.initialize();
let mainWindow;
let overlayWindow;
let formWindow; // Allow formWindow to be null
let pendingRowSelectedKey = null; // Store the key of the selected row for later use
let isInitialSetupComplete = false;
const views = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
require("electron-reload")(path.join(__dirname, "."));
const websites = [
    "https://chatgpt.com/",
    "https://bard.google.com",
    // "https://www.perplexity.ai/",
];
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 2000,
        height: 1100,
        center: true,
        backgroundColor: "#000000",
        show: false, // Start hidden to prevent visual flash
        webPreferences: {
            preload: path.join(__dirname, "..", "dist", "preload.cjs"), // Correct path to compiled preload
            nodeIntegration: true,
            contextIsolation: true,
            offscreen: false,
        },
    });
    remote.enable(mainWindow.webContents);
    // Create the overlay window immediately, but keep it hidden.
    // overlayWindow = new BrowserWindow({
    //   parent: mainWindow,
    //   frame: false,
    //   transparent: true,
    //   alwaysOnTop: true,
    //   show: false, // Keep it hidden initially
    //   focusable: false,
    //   skipTaskbar: true,
    //   webPreferences: {
    //     nodeIntegration: true,
    //     contextIsolation: false,
    //   },
    // });
    // overlayWindow.loadFile(path.join(__dirname, "..", "src", "overlay.html"));
    // overlayWindow.setIgnoreMouseEvents(true);
    // Use 'ready-to-show' to display windows gracefully.
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
        // Now that the main window is visible, match the overlay's size and show it.
        // overlayWindow.setBounds(mainWindow.getBounds());
        // overlayWindow.show();
        // Mark initial setup as complete after a short delay
        setTimeout(() => {
            isInitialSetupComplete = true;
        }, 500);
    });
    mainWindow.loadFile(path.join(__dirname, "..", "index.html")); // Changed to point to root index.html
    mainWindow.webContents.openDevTools({ mode: "detach" });
    const viewWidth = Math.floor(mainWindow.getBounds().width / websites.length);
    const { height } = mainWindow.getBounds();
    websites.forEach((url, index) => {
        const view = new WebContentsView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                // Add the preload script for the view
                preload: path.join(__dirname, "..", "dist", "preload.cjs"), // Correct path to compiled preload
            },
        }); // Cast to CustomBrowserView
        view.id = `${url}`;
        mainWindow.contentView.addChildView(view);
        view.setBounds({
            x: index * viewWidth,
            y: 0,
            width: viewWidth,
            height: height - 235,
        });
        if (view.id.includes("perplexity")) {
            view.webContents.openDevTools({ mode: "detach" });
        }
        if (view.id.includes("lmarena")) {
            view.webContents.openDevTools({ mode: "detach" });
        }
        view.webContents.setZoomFactor(1);
        view.webContents.loadURL(url);
        if (url.includes("chatgpt.com")) {
            view.webContents.on("did-finish-load", () => {
                // Read the observer script from the file
                const observerScriptPath = path.join(__dirname, "..", "dist", "chatgpt-observer.js");
                fs.readFile(observerScriptPath, "utf8", (err, script) => {
                    if (err) {
                        console.error("Failed to read ChatGPT observer script:", err);
                        return;
                    }
                    // Execute the script in the view's web contents
                    view.webContents.executeJavaScript(script)
                        .then(() => console.log("Successfully injected ChatGPT observer script."))
                        .catch(e => console.error("Error injecting ChatGPT observer script:", e));
                });
            });
        }
        views.push(view);
    });
    mainWindow.on("enter-full-screen", () => {
        // overlayWindow.show();
        updateZoomFactor();
    });
    // mainWindow.on("blur", () => {
    //   // Only hide the overlay if the initial setup is done
    //   if (overlayWindow && isInitialSetupComplete) {
    //     overlayWindow.hide();
    //   }
    // });
    // mainWindow.on("focus", () => {
    //   if (overlayWindow) {
    //     overlayWindow.show();
    //   }
    // });
    let resizeTimeout;
    mainWindow.on("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const bounds = mainWindow.getBounds();
            // Also resize the overlay to match the main window
            // if (overlayWindow) {
            //   overlayWindow.setBounds(bounds);
            // }
            const viewWidth = Math.floor(bounds.width / websites.length);
            views.forEach((view, index) => {
                view.setBounds({
                    x: index * viewWidth,
                    y: 0,
                    width: viewWidth,
                    height: bounds.height - 200,
                });
            });
            updateZoomFactor();
        }, 200);
    });
    // This logic has been moved up and placed inside the 'ready-to-show' event.
}
function createFormWindow() {
    formWindow = new BrowserWindow({
        width: 900,
        height: 900,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            preload: path.join(__dirname, "..", "dist", "preload.cjs"), // Correct path to compiled preload
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    formWindow.loadFile(path.join(__dirname, "..", "src", "form.html"));
}
function updateZoomFactor() {
    views.forEach((view) => {
        view.webContents.setZoomFactor(1);
    });
}
app.whenReady().then(createWindow);
app.whenReady().then(() => {
    electronLocalShortcut.register(mainWindow, "Ctrl+W", () => {
        app.quit();
    });
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});
ipcMain.on("open-form-window", () => {
    createFormWindow();
});
ipcMain.on("close-form-window", () => {
    if (formWindow) {
        formWindow.close();
        formWindow = null; // Clear the reference
    }
});
ipcMain.on("save-prompt", (event, promptValue) => {
    // Strip emojis before saving
    const cleanPrompt = stripEmojis(promptValue);
    const timestamp = new Date().getTime().toString();
    store.set(timestamp, cleanPrompt);
    console.log("Prompt saved with key:", timestamp);
    console.log("Original prompt:", promptValue);
    console.log("Cleaned prompt:", cleanPrompt);
});
// Add handler to get stored prompts
ipcMain.handle("get-prompts", () => {
    return store.store; // Returns all stored data
});
// ipcMain.on("paste-prompt", (_: IpcMainEvent, prompt: string) => {
//   mainWindow.webContents.send("inject-prompt", prompt);
//   console.log("paste-prompt received in main.ts:", prompt);
//   views.forEach((view: CustomBrowserView) => {
//     injectPromptIntoView(view, prompt);
//   });
// });
// In main.ts
ipcMain.on("paste-prompt", (_, prompt) => {
    // Strip emojis from the prompt
    const cleanPrompt = stripEmojis(prompt);
    // console.log("paste-prompt received in main.ts (original):", prompt);
    // console.log("paste-prompt (cleaned):", cleanPrompt);
    views.forEach((view) => {
        injectPromptIntoView(view, cleanPrompt);
    });
    // Wrap in IIFE to avoid variable redeclaration errors
    mainWindow.webContents.executeJavaScript(`
    (function() {
      const textarea = document.getElementById('prompt-input');
      if (textarea) {
        textarea.value = \`${cleanPrompt.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}\`;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })();
  `);
});
ipcMain.on("enter-prompt", (_, prompt) => {
    const cleanPrompt = stripEmojis(prompt);
    views.forEach((view) => {
        injectPromptIntoView(view, cleanPrompt);
    });
});
ipcMain.on("send-prompt", (_, prompt) => {
    // Added type for prompt (though unused here)
    views.forEach((view) => {
        sendPromptInView(view);
    });
});
ipcMain.on("delete-prompt-by-value", (event, value) => {
    value = value.normalize("NFKC");
    // Get all key-value pairs from the store
    const allEntries = store.store; // `store.store` gives the entire object
    // Find the key that matches the given value
    const matchingKey = Object.keys(allEntries).find((key) => allEntries[key] === value);
    if (matchingKey) {
        store.delete(matchingKey);
        console.log(`Deleted entry with key: ${matchingKey} and value: ${value}`);
    }
    else {
        console.error(`No matching entry found for value: ${value}`);
    }
});
// ipcMain.on("open-lm-arena", (_, prompt: string) => {
//   if (prompt === "open lm arena now") {
//     console.log("Opening LMArena");
//     let url = "https://lmarena.ai/";
//     addBrowserView(mainWindow, url, websites, views);
//   }
// });
// ipcMain.on("close-lm-arena", (_, prompt: string) => {
//   if (prompt === "close lm arena now") {
//     console.log("Closing LMArena");
//     const lmArenaView = views.find((view) => view.id.match("lmarena"));
//     if (lmArenaView) {
//       removeBrowserView(mainWindow, lmArenaView, websites, views);
//     }
//   }
// });
ipcMain.on("open-claude", (_, prompt) => {
    if (prompt === "open claude now") {
        console.log("Opening Claude");
        let url = "https://claude.ai/chats/";
        addBrowserView(mainWindow, url, websites, views);
    }
});
ipcMain.on("close-claude", (_, prompt) => {
    if (prompt === "close claude now") {
        console.log("Closing Claude");
        const claudeView = views.find((view) => view.id.match("claude"));
        if (claudeView) {
            removeBrowserView(mainWindow, claudeView, websites, views);
        }
    }
});
ipcMain.on("open-grok", (_, prompt) => {
    if (prompt === "open grok now") {
        console.log("Opening Grok");
        let url = "https://grok.com/";
        addBrowserView(mainWindow, url, websites, views);
    }
});
ipcMain.on("close-grok", (_, prompt) => {
    if (prompt === "close grok now") {
        console.log("Closing Grok");
        const grokView = views.find((view) => view.id.match("grok"));
        if (grokView) {
            removeBrowserView(mainWindow, grokView, websites, views);
        }
    }
});
ipcMain.on("open-deepseek", (_, prompt) => {
    if (prompt === "open deepseek now") {
        console.log("Opening DeepSeek");
        let url = "https://chat.deepseek.com/";
        addBrowserView(mainWindow, url, websites, views);
    }
});
ipcMain.on("close-deepseek", (_, prompt) => {
    if (prompt === "close deepseek now") {
        console.log("Closing Deepseek");
        const deepseekView = views.find((view) => view.id.match("deepseek"));
        if (deepseekView) {
            removeBrowserView(mainWindow, deepseekView, websites, views);
        }
    }
});
ipcMain.on("open-edit-view", (_, prompt) => {
    console.log("Opening edit view for prompt:", prompt);
    prompt = prompt.normalize("NFKC");
    const editWindow = new BrowserWindow({
        width: 500,
        height: 600,
        parent: formWindow || mainWindow, // Use mainWindow as a fallback if formWindow is null
        modal: true, // Make it a modal window
        webPreferences: {
            preload: path.join(__dirname, "..", "dist", "preload.cjs"), // Correct path to compiled preload
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    editWindow.loadFile(path.join(__dirname, "..", "src", "edit_prompt.html"));
    // Optionally, inject the prompt into the textarea
    editWindow.webContents.once("did-finish-load", () => {
        editWindow.webContents.executeJavaScript(`
      const textarea = document.getElementById('template-content');
      if (textarea) {
        textarea.value = \`${prompt}\`;
      }
    `);
    });
    console.log("Edit window created.");
});
ipcMain.on("edit-prompt-ready", (event) => {
    if (pendingRowSelectedKey) {
        event.sender.send("row-selected", pendingRowSelectedKey);
        console.log(`Sent row-selected message to edit_prompt.html with key: ${pendingRowSelectedKey} (on renderer ready)`);
        pendingRowSelectedKey = null;
    }
    else {
        console.log("edit-prompt-ready received, but no pending key to send.");
    }
});
ipcMain.on("update-prompt", (_, { key, value }) => {
    if (store.has(key)) {
        store.set(key, value);
        console.log(`Updated prompt with key "${key}" to: "${value}"`);
    }
    else {
        console.error(`No entry found for key: "${key}"`);
    }
});
ipcMain.on("row-selected", (_, key) => {
    console.log(`Row selected with key: ${key}`);
    pendingRowSelectedKey = key;
});
// Add handler to fetch the key from the store based on the value.
ipcMain.handle("get-key-by-value", (_, value) => {
    value = value.normalize("NFKC"); // Normalize the value for consistency
    const allEntries = store.store; // Get all key-value pairs from the store
    console.log("Store contents:", allEntries); // Log the store contents
    // Find the key that matches the given value
    const matchingKey = Object.keys(allEntries).find((key) => allEntries[key] === value);
    if (matchingKey) {
        console.log(`Found key "${matchingKey}" for value: "${value}"`);
        return matchingKey;
    }
    else {
        console.error(`No matching key found for value: "${value}"`);
        return null;
    }
});
ipcMain.on("close-edit-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.close();
    }
});
ipcMain.on("close-edit-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.close();
        // Notify the form window to refresh the table
        if (formWindow && !formWindow.isDestroyed()) {
            formWindow.webContents.send("refresh-prompt-table");
        }
    }
});
// Listen for the notification from the observer script
ipcMain.on("content-copied", () => {
    // A brief delay to ensure the clipboard has been updated
    setTimeout(() => {
        const copiedText = clipboard.readText();
        console.log("--- Content Pasted from Clipboard ---");
        console.log(copiedText);
        console.log("------------------------------------");
    }, 100); // 100ms delay
});
