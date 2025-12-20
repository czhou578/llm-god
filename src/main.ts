import {
  app,
  BrowserWindow,
  ipcMain,
  WebContentsView,
  IpcMainEvent,
} from "electron";
import * as remote from "@electron/remote/main/index.js";
import path from "path";
import electronLocalShortcut from "electron-localshortcut";
import {
  addBrowserView,
  removeBrowserView,
  injectPromptIntoView,
  sendPromptInView,
  stripEmojis, // Add this import
  openNewChatInView,
  injectImageIntoView
} from "./utilities.js"; // Adjusted path
import { createRequire } from "node:module"; // Import createRequire
import { fileURLToPath } from "node:url"; // Import fileURLToPath
import Store from "electron-store"; // Import electron-store

const require = createRequire(import.meta.url);
const store = new Store(); // Create an instance of electron-store

interface CustomBrowserView extends WebContentsView {
  id: string; // Make id optional as it's assigned after creation
}

// if (require("electron-squirrel-startup")) app.quit();

remote.initialize();

let mainWindow: BrowserWindow;
let overlayWindow: BrowserWindow;
let formWindow: BrowserWindow | null; // Allow formWindow to be null
let modelSelectionWindow: BrowserWindow | null = null;
let pendingRowSelectedKey: string | null = null; // Store the key of the selected row for later use
let isInitialSetupComplete = false;

const views: CustomBrowserView[] = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only use electron-reload in development
if (process.env.NODE_ENV !== "production") {
  try {
    console.log("→ electron-reload is active");
    // Watch the project root directory instead of dist
    require("electron-reload")(path.join(__dirname, ".."), {
      electron: path.join(__dirname, "..", "node_modules", ".bin", "electron"),
      hardResetMethod: "exit",
    });
  } catch (e) {
    // electron-reload not available in production, skip it
  }
}

// Load default models from store, or use defaults
const getDefaultWebsites = (): string[] => {
  const savedModels = store.get("defaultModels") as string[] | undefined;
  if (savedModels && savedModels.length > 0) {
    return savedModels;
  }
  // Default models if none are saved
  return ["https://chatgpt.com", "https://gemini.google.com"];
};

const websites: string[] = getDefaultWebsites();

// Add this helper function near the top of your file, after imports
function getViewHeight(windowHeight: number): number {
  // Calculate the height for browser views
  // This leaves space for the textarea and controls at the bottom
  const controlsHeight = 235; // Height reserved for textarea and buttons (min 180px + padding 20px + buttons ~35px)
  return windowHeight - controlsHeight;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 2000,
    height: 1100,
    center: true,
    backgroundColor: "#000000",
    show: false,
    icon: path.join(__dirname, "..", "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "..", "dist", "preload.cjs"),
      nodeIntegration: true,
      contextIsolation: true,
      offscreen: false,
    },
  });
  remote.enable(mainWindow.webContents);

  // Use 'ready-to-show' to display windows gracefully.
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    setTimeout(() => {
      isInitialSetupComplete = true;
    }, 500);
  });

  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));

  const bounds = mainWindow.getBounds();
  const viewWidth = Math.floor(bounds.width / websites.length);
  const viewHeight = getViewHeight(bounds.height); // Use helper function

  websites.forEach((url: string, index: number) => {
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // Add the preload script for the view
        preload: path.join(__dirname, "..", "dist", "preload.cjs"), // Correct path to compiled preload
      },
    }) as CustomBrowserView; // Cast to CustomBrowserView

    // Set background color to prevent white flash while loading
    view.setBackgroundColor("#000000");

    view.id = `${url}`;
    mainWindow.contentView.addChildView(view);
    view.setBounds({
      x: index * viewWidth,
      y: 0,
      width: viewWidth,
      height: viewHeight, // Use calculated height
    });

    view.webContents.setZoomFactor(1);
    view.webContents.loadURL(url);

    // Open DevTools for each view for debugging
    // view.webContents.openDevTools({ mode: "detach" });

    views.push(view);
  });

  mainWindow.on("enter-full-screen", () => {
    updateZoomFactor();
    updateViewBounds(); // Update bounds when entering fullscreen
  });

  mainWindow.on("leave-full-screen", () => {
    updateViewBounds(); // Update bounds when leaving fullscreen
  });

  let resizeTimeout: NodeJS.Timeout;

  mainWindow.on("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateViewBounds(); // Use helper function
    }, 200); // Debounce to avoid too many updates
  });

  // This logic has been moved up and placed inside the 'ready-to-show' event.
}

async function createFormWindow() {
  // Get current theme from main window first
  const currentTheme = await mainWindow.webContents.executeJavaScript(
    'localStorage.getItem("theme")',
  );

  formWindow = new BrowserWindow({
    width: 900,
    height: 900,
    parent: mainWindow,
    modal: true,
    show: false, // Don't show window until theme is applied
    backgroundColor: currentTheme === "dark" ? "#1e1e1e" : "#f0f0f0",
    icon: path.join(__dirname, "..", "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "..", "dist", "preload.cjs"), // Correct path to compiled preload
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Apply theme immediately when DOM is ready, before showing
  formWindow.webContents.on("dom-ready", async () => {
    const themeClass = currentTheme === "dark" ? "dark-mode" : "light-mode";
    await formWindow!.webContents.executeJavaScript(`
      document.body.classList.add('${themeClass}');
    `);
  });

  // Use ready-to-show event for smoother display
  formWindow.once("ready-to-show", () => {
    formWindow!.show();
  });

  await formWindow.loadFile(path.join(__dirname, "..", "src", "form.html"));
}

async function createModelSelectionWindow() {
  // Get current theme from main window first
  const currentTheme = await mainWindow.webContents.executeJavaScript(
    'localStorage.getItem("theme")',
  );

  modelSelectionWindow = new BrowserWindow({
    width: 600,
    height: 700,
    parent: mainWindow,
    modal: true,
    show: false, // Don't show window until theme is applied
    backgroundColor: currentTheme === "dark" ? "#1e1e1e" : "#f5f5f5",
    icon: path.join(__dirname, "..", "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "..", "dist", "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Apply theme immediately when DOM is ready, before showing
  modelSelectionWindow.webContents.on("dom-ready", async () => {
    const themeClass = currentTheme === "dark" ? "dark-mode" : "light-mode";
    await modelSelectionWindow!.webContents.executeJavaScript(`
      document.body.classList.add('${themeClass}');
    `);
  });

  // Use ready-to-show event for smoother display
  modelSelectionWindow.once("ready-to-show", () => {
    modelSelectionWindow!.show();
  });

  await modelSelectionWindow.loadFile(
    path.join(__dirname, "..", "src", "select_models.html"),
  );
}

function updateZoomFactor(): void {
  views.forEach((view) => {
    view.webContents.setZoomFactor(1);
  });
}

// Add this helper function to update view bounds consistently
function updateViewBounds(): void {
  const bounds = mainWindow.getBounds();
  const viewWidth = Math.floor(bounds.width / websites.length);
  const viewHeight = getViewHeight(bounds.height);

  views.forEach((view, index) => {
    view.setBounds({
      x: index * viewWidth,
      y: 0,
      width: viewWidth,
      height: viewHeight,
    });
  });

  updateZoomFactor();
}

app.whenReady().then(createWindow);
app.whenReady().then(() => {
  electronLocalShortcut.register(mainWindow, "Ctrl+W", () => {
    app.quit();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Cleanup handler before app quits
app.on("before-quit", () => {
  console.log("Cleaning up resources before quit...");

  // Destroy all browser views
  views.forEach((view) => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.contentView.removeChildView(view);
      }
      // @ts-ignore - close() method exists but may not be in type definitions
      if (view.webContents && !view.webContents.isDestroyed()) {
        view.webContents.close();
      }
    } catch (error) {
      console.error("Error cleaning up view on quit:", error);
    }
  });
  views.length = 0;
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

ipcMain.on("enter-prompt", (_: IpcMainEvent, prompt: string) => {
  const cleanPrompt = stripEmojis(prompt);

  views.forEach((view: CustomBrowserView) => {
    injectPromptIntoView(view, cleanPrompt);
  });
});

ipcMain.on("send-prompt", (_, prompt: string) => {
  const cleanPrompt = stripEmojis(prompt);

  views.forEach(async (view) => {
    try {
      await injectPromptIntoView(view, cleanPrompt);
    } catch (error) {
      console.error(`Error injecting prompt:`, error);
    }

    // Increase timeout for Copilot and other sites to properly inject the prompt
    const delay = view.id && view.id.match("copilot") ? 300 : 100;
    setTimeout(async () => {
      try {
        await sendPromptInView(view);
      } catch (error) {
        console.error(`Error sending prompt:`, error);
      }
    }, delay);
  });
});

ipcMain.on("save-prompt", (event, promptValue: string) => {
  // Strip emojis before saving
  const cleanPrompt = stripEmojis(promptValue);

  const timestamp = new Date().getTime().toString();
  store.set(timestamp, cleanPrompt);

  console.log("Prompt saved with key:", timestamp);
  console.log("Original prompt:", promptValue);
  console.log("Cleaned prompt:", cleanPrompt);
});

// ------------------------------------------------------------------------------

// Add handler to get stored prompts
ipcMain.handle("get-prompts", () => {
  return store.store; // Returns all stored data
});

ipcMain.on("paste-prompt", (_: IpcMainEvent, prompt: string) => {
  // Strip emojis from the prompt
  const cleanPrompt = stripEmojis(prompt);

  views.forEach((view: CustomBrowserView) => {
    injectPromptIntoView(view, cleanPrompt);
  });

  // Wrap in IIFE to avoid variable redeclaration errors
  mainWindow.webContents.executeJavaScript(`
    (function() {
      const textarea = document.getElementById('prompt-input');
      if (textarea) {
        textarea.value = \`${cleanPrompt.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}\`;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })();
  `);
});

ipcMain.on("delete-prompt-by-value", (event, value: string) => {
  value = value.normalize("NFKC");
  // Get all key-value pairs from the store
  const allEntries = store.store; // `store.store` gives the entire object

  // Find the key that matches the given value
  const matchingKey = Object.keys(allEntries).find(
    (key) => allEntries[key] === value,
  );

  if (matchingKey) {
    store.delete(matchingKey);
    console.log(`Deleted entry with key: ${matchingKey} and value: ${value}`);
  } else {
    console.error(`No matching entry found for value: ${value}`);
  }
});

// ------------------------------------------------------------------------------

ipcMain.on("open-claude", (_, prompt: string) => {
  if (prompt === "open claude now") {
    console.log("Opening Claude");
    let url = "https://claude.ai/chats/";
    // Check if Claude is already open
    const alreadyOpen = views.some((view) => view.id.match("claude"));
    if (!alreadyOpen) {
      addBrowserView(mainWindow, url, websites, views);
    } else {
      console.log("Claude is already open");
    }
  }
});

ipcMain.on("close-claude", (_, prompt: string) => {
  if (prompt === "close claude now") {
    console.log("Closing Claude");
    const claudeView = views.find((view) => view.id.match("claude"));
    if (claudeView) {
      removeBrowserView(mainWindow, claudeView, websites, views);
    }
  }
});

ipcMain.on("open-grok", (_, prompt: string) => {
  if (prompt === "open grok now") {
    console.log("Opening Grok");
    let url = "https://grok.com/";
    // Check if Grok is already open
    const alreadyOpen = views.some((view) => view.id.match("grok"));
    if (!alreadyOpen) {
      addBrowserView(mainWindow, url, websites, views);
    } else {
      console.log("Grok is already open");
    }
  }
});

ipcMain.on("close-grok", (_, prompt: string) => {
  if (prompt === "close grok now") {
    console.log("Closing Grok");
    const grokView = views.find((view) => view.id.match("grok"));
    if (grokView) {
      removeBrowserView(mainWindow, grokView, websites, views);
    }
  }
});

ipcMain.on("open-deepseek", (_, prompt: string) => {
  if (prompt === "open deepseek now") {
    console.log("Opening DeepSeek");
    let url = "https://chat.deepseek.com/";
    // Check if DeepSeek is already open
    const alreadyOpen = views.some((view) => view.id.match("deepseek"));
    if (!alreadyOpen) {
      addBrowserView(mainWindow, url, websites, views);
    } else {
      console.log("DeepSeek is already open");
    }
  }
});

ipcMain.on("close-deepseek", (_, prompt: string) => {
  if (prompt === "close deepseek now") {
    console.log("Closing Deepseek");
    const deepseekView = views.find((view) => view.id.match("deepseek"));
    if (deepseekView) {
      removeBrowserView(mainWindow, deepseekView, websites, views);
    }
  }
});

ipcMain.on("open-copilot", (_, prompt: string) => {
  if (prompt === "open copilot now") {
    console.log("Opening Copilot");
    let url = "https://copilot.microsoft.com/";
    // Check if Copilot is already open
    const alreadyOpen = views.some((view) => view.id.match("copilot"));
    if (!alreadyOpen) {
      addBrowserView(mainWindow, url, websites, views);
    } else {
      console.log("Copilot is already open");
    }
  }
});

ipcMain.on("close-copilot", (_, prompt: string) => {
  if (prompt === "close copilot now") {
    console.log("Closing Copilot");
    const copilotView = views.find((view) => view.id.match("copilot"));
    if (copilotView) {
      removeBrowserView(mainWindow, copilotView, websites, views);
    }
  }
});

ipcMain.on("open-chatgpt", (_, prompt: string) => {
  if (prompt === "open chatgpt now") {
    console.log("Opening ChatGPT");
    let url = "https://chatgpt.com";
    // Check if ChatGPT is already open
    const alreadyOpen = views.some((view) => view.id.match("chatgpt"));
    if (!alreadyOpen) {
      addBrowserView(mainWindow, url, websites, views);
    } else {
      console.log("ChatGPT is already open");
    }
  }
});

ipcMain.on("close-chatgpt", (_, prompt: string) => {
  if (prompt === "close chatgpt now") {
    console.log("Closing ChatGPT");
    const chatgptView = views.find((view) => view.id.match("chatgpt"));
    if (chatgptView) {
      removeBrowserView(mainWindow, chatgptView, websites, views);
    }
  }
});

ipcMain.on("open-gemini", (_, prompt: string) => {
  if (prompt === "open gemini now") {
    console.log("Opening Gemini");
    let url = "https://gemini.google.com";
    // Check if Gemini is already open
    const alreadyOpen = views.some((view) => view.id.match("gemini"));
    if (!alreadyOpen) {
      addBrowserView(mainWindow, url, websites, views);
    } else {
      console.log("Gemini is already open");
    }
  }
});

ipcMain.on("close-gemini", (_, prompt: string) => {
  if (prompt === "close gemini now") {
    console.log("Closing Gemini");
    const geminiView = views.find((view) => view.id.match("gemini"));
    if (geminiView) {
      removeBrowserView(mainWindow, geminiView, websites, views);
    }
  }
});

ipcMain.on("new-chat", () => {
  console.log("New chat requested");
  views.forEach((view) => {
    try {
      openNewChatInView(view); // Inject empty prompt to reset
    } catch (error) {
      console.error("Error resetting prompt in view:", error);
    }
  });
});

ipcMain.on("open-edit-view", async (_, prompt: string) => {
  console.log("Opening edit view for prompt:", prompt);
  prompt = prompt.normalize("NFKC");

  // Get current theme from main window first
  const currentTheme = await mainWindow.webContents.executeJavaScript(
    'localStorage.getItem("theme")',
  );

  const editWindow = new BrowserWindow({
    width: 500,
    height: 600,
    parent: formWindow || mainWindow, // Use mainWindow as a fallback if formWindow is null
    modal: true, // Make it a modal window
    show: false, // Don't show window until theme is applied
    backgroundColor: currentTheme === "dark" ? "#1e1e1e" : "#f0f0f0",
    icon: path.join(__dirname, "..", "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "..", "dist", "preload.cjs"), // Correct path to compiled preload
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Apply theme and inject prompt when DOM is ready
  const escapedPrompt = prompt
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
  const themeClass = currentTheme === "dark" ? "dark-mode" : "light-mode";
  editWindow.webContents.on("dom-ready", async () => {
    await editWindow.webContents.executeJavaScript(`
      document.body.classList.add('${themeClass}');
      const textarea = document.getElementById('template-content');
      if (textarea) {
        textarea.value = \`${escapedPrompt}\`;
      }
    `);
  });

  // Use ready-to-show event for smoother display
  editWindow.once("ready-to-show", () => {
    editWindow.show();
  });

  await editWindow.loadFile(
    path.join(__dirname, "..", "src", "edit_prompt.html"),
  );

  console.log("Edit window created.");
});

ipcMain.on("edit-prompt-ready", (event) => {
  if (pendingRowSelectedKey) {
    event.sender.send("row-selected", pendingRowSelectedKey);
    console.log(
      `Sent row-selected message to edit_prompt.html with key: ${pendingRowSelectedKey} (on renderer ready)`,
    );
    pendingRowSelectedKey = null;
  } else {
    console.log("edit-prompt-ready received, but no pending key to send.");
  }
});

ipcMain.on(
  "update-prompt",
  (_, { key, value }: { key: string; value: string }) => {
    if (store.has(key)) {
      store.set(key, value);
      console.log(`Updated prompt with key "${key}" to: "${value}"`);
    } else {
      console.error(`No entry found for key: "${key}"`);
    }
  },
);

ipcMain.on("row-selected", (_, key: string) => {
  console.log(`Row selected with key: ${key}`);
  pendingRowSelectedKey = key;
});

// Add handler to fetch the key from the store based on the value.
ipcMain.handle("get-key-by-value", (_, value: string) => {
  value = value.normalize("NFKC"); // Normalize the value for consistency
  const allEntries = store.store; // Get all key-value pairs from the store

  console.log("Store contents:", allEntries); // Log the store contents

  // Find the key that matches the given value
  const matchingKey = Object.keys(allEntries).find(
    (key) => allEntries[key] === value,
  );

  if (matchingKey) {
    console.log(`Found key "${matchingKey}" for value: "${value}"`);
    return matchingKey;
  } else {
    console.error(`No matching key found for value: "${value}"`);
    return null;
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

// Model selection window handlers
ipcMain.on("open-model-selection-window", () => {
  createModelSelectionWindow();
});

ipcMain.on("close-model-selection-window", () => {
  if (modelSelectionWindow) {
    modelSelectionWindow.close();
    modelSelectionWindow = null;
  }
});

ipcMain.handle("get-default-models", () => {
  return store.get("defaultModels") || [];
});

ipcMain.handle("get-current-theme", () => {
  return mainWindow.webContents.executeJavaScript(
    'localStorage.getItem("theme")',
  );
});

ipcMain.handle("get-open-views", () => {
  return views.map((view) => view.id);
});

ipcMain.on("save-default-models", (_, models: string[]) => {
  store.set("defaultModels", models);
  console.log("Saved default models:", models);

  // Close model selection window
  if (modelSelectionWindow) {
    modelSelectionWindow.close();
    modelSelectionWindow = null;
  }

  // Cleanup: destroy all browser views before reload
  console.log("Cleaning up browser views before reload...");
  views.forEach((view) => {
    try {
      mainWindow.contentView.removeChildView(view);
      // @ts-ignore - close() method exists but may not be in type definitions
      if (view.webContents && !view.webContents.isDestroyed()) {
        view.webContents.close();
      }
    } catch (error) {
      console.error("Error cleaning up view:", error);
    }
  });
  views.length = 0; // Clear the views array

  // Close all other windows
  if (formWindow && !formWindow.isDestroyed()) {
    formWindow.close();
    formWindow = null;
  }

  console.log("Recreating browser views with new models...");

  // Reload the websites array with new models
  const newWebsites = store.get("defaultModels") as string[];

  // Recreate the browser views with new models
  const bounds = mainWindow.getBounds();
  const viewWidth = Math.floor(bounds.width / newWebsites.length);
  const viewHeight = getViewHeight(bounds.height);

  newWebsites.forEach((url: string, index: number) => {
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "..", "dist", "preload.cjs"),
      },
    }) as CustomBrowserView;

    view.setBackgroundColor('#000000');
    view.id = `${url}`;
    mainWindow.contentView.addChildView(view);
    view.setBounds({
      x: index * viewWidth,
      y: 0,
      width: viewWidth,
      height: viewHeight,
    });

    view.webContents.setZoomFactor(1);
    view.webContents.loadURL(url);
    views.push(view);
  });

  console.log("Browser views recreated successfully");
  // Restart the application
  if (process.env.NODE_ENV === "production") {
    // In production, use relaunch
    app.relaunch();
    app.exit(0);
  } else {
    // In development with npm run dev, use special exit code
    // The dev-runner.js will detect this and restart
    console.log("🔄 Development mode: Closing app for auto-restart...");
    app.exit(42); // Special exit code 42 = intentional restart
  }
});

ipcMain.on("paste-image", (_, imageData: string) => {
  // Paste image data into all views that support it
  views.forEach((view: CustomBrowserView) => {
    injectImageIntoView(view, imageData);
  });
});
