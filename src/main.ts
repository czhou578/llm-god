import { app, BrowserWindow, BrowserView, ipcMain, IpcMainEvent} from "electron";
import * as remote from "@electron/remote/main/index.js";
import path from "path";
import electronLocalShortcut from "electron-localshortcut";
import { addBrowserView, removeBrowserView } from "./utilities.js"; // Adjusted path
import { createRequire } from "node:module"; // Import createRequire
import { fileURLToPath } from "node:url"; // Import fileURLToPath

const require = createRequire(import.meta.url);

interface CustomBrowserView extends BrowserView {
    id: string; // Make id optional as it's assigned after creation
}

if (require("electron-squirrel-startup")) app.quit();

remote.initialize();

let mainWindow: BrowserWindow;
const views: CustomBrowserView[] = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// require("electron-reload")(path.join(__dirname, "."));

const websites: string[] = [
  "https://chatgpt.com/",
  "https://bard.google.com",
  "https://www.perplexity.ai/",
];

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 2000,
    height: 1000,
    center: true,
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"), // This will point to dist/preload.js at runtime
      nodeIntegration: true,
      contextIsolation: false,
      offscreen: false,
    },
  });
  remote.enable(mainWindow.webContents);

  mainWindow.loadFile(path.join(__dirname, "..", "index.html")); // Changed to point to root index.html

  mainWindow.webContents.openDevTools({ mode: "detach" });
  const viewWidth = Math.floor(mainWindow.getBounds().width / websites.length);
  const { height } = mainWindow.getBounds();

  websites.forEach((url: string, index: number) => {
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
      },
    }) as CustomBrowserView; // Cast to CustomBrowserView

    view.id = `${url}`;
    mainWindow.addBrowserView(view);
    view.setBounds({
      x: index * viewWidth,
      y: 0,
      width: viewWidth,
      height: height - 200,
    });
    // view.webContents.openDevTools({ mode: "detach" });
    view.webContents.setZoomFactor(1);
    view.webContents.loadURL(url);

    views.push(view);
  });

  mainWindow.on("enter-full-screen", () => {
    updateZoomFactor();
  });

  mainWindow.on("focus", () => {
    mainWindow.webContents.invalidate();
  });

  mainWindow.on("resize", () => {
    const { width, height } = mainWindow.getBounds();
    const viewWidth = Math.floor(width / websites.length);
    views.forEach((view, index) => {
      view.setBounds({
        x: index * viewWidth,
        y: 0,
        width: viewWidth,
        height: height - 200,
      });
    });
    updateZoomFactor();
  });
}

function updateZoomFactor(): void {
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
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("enter-prompt", (event: IpcMainEvent, prompt: string) => { // Added type for prompt
  views.forEach((view: CustomBrowserView) => {
    if (view.id.match("chatgpt")) {
      view.webContents.executeJavaScript(`
          (function() {
    const inputElement = document.querySelector('#prompt-textarea > p');
    if (inputElement) {
      const inputEvent = new Event('input', { bubbles: true });
      inputElement.innerText = \`${prompt}\`;
      inputElement.dispatchEvent(inputEvent);
    }
  })();`);
    } else if (view.id.match("bard")) {
      view.webContents.executeJavaScript(`{
                var inputElement = document.querySelector(".ql-editor.textarea");
                if (inputElement) {
                  const inputEvent = new Event('input', { bubbles: true });
                  inputElement.value = \`${prompt}\`;
                  inputElement.dispatchEvent(inputEvent);
                  inputElement.querySelector('p').textContent = \`${prompt}\`
                }
              }`);
    } else if (view.id.match("perplexity")) {
      view.webContents.executeJavaScript(`
                var inputElement = document.querySelector('textarea[placeholder*="Ask"]');
        if (inputElement) {
          var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          nativeTextAreaValueSetter.call(inputElement, \`${prompt}\`);
          var event = new Event('input', { bubbles: true});
          inputElement.dispatchEvent(event);
        }`);
    } else if (view.id.match("claude")) {
      view.webContents.executeJavaScript(`{
    var inputElement = document.querySelector('div.ProseMirror')
		if (inputElement) {
			inputElement.innerHTML = \`${prompt}\`
		}
	}`);
    } else if (view.id.match("grok")) {
      view.webContents.executeJavaScript(`
        var inputElement = document.querySelector('textarea');
        if (inputElement) {
          const span = inputElement.previousElementSibling;
          if (span) {
            span.classList.add("hidden");
          }
          var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          nativeTextAreaValueSetter.call(inputElement, \`${prompt}\`);
          const inputEvent = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(inputEvent);
        }`);
    } else if (view.id.match("deepseek")) {
      view.webContents.executeJavaScript(`
        var inputElement = document.querySelector('textarea');
        if (inputElement) {
          var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          nativeTextAreaValueSetter.call(inputElement, \`${prompt}\`);
          const inputEvent = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(inputEvent);
        }`);
    }
  });
});

ipcMain.on("send-prompt", (event, prompt: string) => { // Added type for prompt (though unused here)
  views.forEach((view) => {
    if (view.id.match("chatgpt")) {
      view.webContents.executeJavaScript(`
            var btn = document.querySelector('button[aria-label*="Send prompt"]');
            if (btn) {
                btn.focus();
                btn.disabled = false;
                btn.click();
            }
        `);
    } else if (view.id.match("bard")) {
      view.webContents.executeJavaScript(`{
      var btn = document.querySelector("button[aria-label*='Send message']");
      if (btn) {
        btn.setAttribute("aria-disabled", "false");
        btn.focus();
        btn.click();
      }
    }`);
    } else if (view.id.match("perplexity")) {
      view.webContents.executeJavaScript(`
                {
        var buttons = Array.from(document.querySelectorAll('button.bg-super'));
				if (buttons[0]) {
					var buttonsWithSvgPath = buttons.filter(button => button.querySelector('svg path'));
					var button = buttonsWithSvgPath[buttonsWithSvgPath.length - 1];
					button.click();
				}
      }
                `);
    } else if (view.id.match("claude")) {
      view.webContents.executeJavaScript(`{
		var btn = document.querySelector("button[aria-label*='Send message']");
    if (!btn) var btn = document.querySelector('button:has(div svg)');
    if (!btn) var btn = document.querySelector('button:has(svg)');
		if (btn) {
			btn.focus();
			btn.disabled = false;
			btn.click();
		}
  }`);
    } else if (view.id.match("grok")) {
      view.webContents.executeJavaScript(`
        {
        var btn = document.querySelector('button[aria-label*="Submit"]');
        if (btn) {
            btn.focus();
			      btn.disabled = false;
            btn.click();
          } else {
            console.log("Element not found");
          }
      }`);
    } else if (view.id.match("deepseek")) {
      view.webContents.executeJavaScript(`
        {
        var buttons = Array.from(document.querySelectorAll('div[role="button"]'));
        var btn = buttons[2]
        if (btn) {
            btn.focus();
            // btn.disabled = false; // 'disabled' might not be applicable for div role="button"
            btn.click();
          } else {
            console.log("Element not found");
          }
    }`);
    }
  });
});

ipcMain.on("open-perplexity", (event, prompt: string) => {
  if (prompt === "open perplexity now") {
    console.log("Opening Perplexity");
    let url = "https://www.perplexity.ai/";
    addBrowserView(mainWindow, url, websites, views);
  }
});

ipcMain.on("close-perplexity", (event, prompt: string) => {
  if (prompt === "close perplexity now") {
    console.log("Closing Perplexity");
    const perplexityView = views.find((view) => view.id.match("perplexity"));
    if (perplexityView) { // Add check if view exists
        removeBrowserView(mainWindow, perplexityView, websites, views);
    }
  }
});

ipcMain.on("open-claude", (event, prompt: string) => {
  if (prompt === "open claude now") {
    console.log("Opening Claude");
    let url = "https://claude.ai/chats/";
    addBrowserView(mainWindow, url, websites, views);
  }
});

ipcMain.on("close-claude", (event, prompt: string) => {
  if (prompt === "close claude now") {
    console.log("Closing Claude");
    const claudeView = views.find((view) => view.id.match("claude"));
    if (claudeView) { // Add check
        removeBrowserView(mainWindow, claudeView, websites, views);
    }
  }
});

ipcMain.on("open-grok", (event, prompt: string) => {
  if (prompt === "open grok now") {
    console.log("Opening Grok");
    let url = "https://grok.com/";
    addBrowserView(mainWindow, url, websites, views);
  }
});

ipcMain.on("close-grok", (event, prompt: string) => {
  if (prompt === "close grok now") {
    console.log("Closing Grok");
    const grokView = views.find((view) => view.id.match("grok"));
    if (grokView) { // Add check
        removeBrowserView(mainWindow, grokView, websites, views);
    }
  }
});

ipcMain.on("open-deepseek", (event, prompt: string) => {
  if (prompt === "open deepseek now") {
    console.log("Opening DeepSeek");
    let url = "https://chat.deepseek.com/";
    addBrowserView(mainWindow, url, websites, views);
  }
});

ipcMain.on("close-deepseek", (event, prompt: string) => {
  if (prompt === "close deepseek now") {
    console.log("Closing Deepseek");
    const deepseekView = views.find((view) => view.id.match("deepseek"));
    if (deepseekView) { // Add check
        removeBrowserView(mainWindow, deepseekView, websites, views);
    }
  }
});
