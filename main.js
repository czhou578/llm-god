const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const remote = require("@electron/remote/main");
const path = require("path");
const electronLocalShortcut = require("electron-localshortcut");
const { addBrowserView, removeBrowserView } = require("./utilities");
// const { BrowserView } = require("@electron/remote");

if (require("electron-squirrel-startup")) app.quit();

remote.initialize();

let mainWindow;
const views = [];

// require("electron-reload")(path.join(__dirname, "."));

const websites = [
  "https://chat.openai.com/",
  "https://bard.google.com",
  "https://www.meta.ai/",
];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
      offscreen: false,
    },
    fullscreen: true,
  });

  remote.enable(mainWindow.webContents);

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  // mainWindow.webContents.openDevTools({ mode: "detach" });
  const viewWidth = Math.floor(mainWindow.getBounds().width / websites.length);
  const { height } = mainWindow.getBounds();

  websites.forEach((url, index) => {
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    view.id = `${url}`;
    mainWindow.addBrowserView(view);
    view.setBounds({
      x: index * viewWidth,
      y: 0,
      width: viewWidth,
      height: height - 200,
    });
    view.webContents.setZoomFactor(1); // Set initial zoom factor to 150%
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

function updateZoomFactor() {
  views.forEach((view) => {
    view.webContents.setZoomFactor(1);
  });
}

app.whenReady().then(createWindow);
app.whenReady().then(() => {
  electronLocalShortcut.register(mainWindow, "Ctrl+W", () => {
    app.quit(); // or mainWindow.close();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/**
 * innerhtml doesn't work
 * textContent doesn't work, but is less prone to breaking.
 */

ipcMain.on("enter-prompt", (event, prompt) => {
  views.forEach((view) => {
    if (view.id.match("openai")) {
      view.webContents.executeJavaScript(`
        {

            const inputElement = document.querySelector('#prompt-textarea > p');
            const fixDivContainer = document.querySelector('div.flex-1.overflow-hidden > div.h-full')

            if (inputElement) {
              const inputEvent = new Event('input', { bubbles: true });
              inputElement.innerText = \`${prompt}\`; // must be escaped backticks to support multiline
              fixDivContainer.style.height = '0'
              console.log('the div container changed')
              fixDivContainer.style.height = '100%'
              inputElement.dispatchEvent(inputEvent);
            }
          }
            `);
    } else if (view.id.match("bard")) {
      view.webContents.executeJavaScript(`{
                var inputElement = document.querySelector(".ql-editor.textarea");
                if (inputElement) {
                  const inputEvent = new Event('input', { bubbles: true });
                  inputElement.value = \`${prompt}\`; // must be escaped backticks to support multiline
                  inputElement.dispatchEvent(inputEvent);
                  // bard is weird
                  inputElement.querySelector('p').textContent = \`${prompt}\`
                }
              }
                `);
    } else if (view.id.match("perplexity")) {
      view.webContents.executeJavaScript(`
                var inputElement = document.querySelector('textarea[placeholder*="Ask"]'); // can be "Ask anything" or "Ask follow-up"
        if (inputElement) {
          var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          nativeTextAreaValueSetter.call(inputElement, \`${prompt}\`);

          var event = new Event('input', { bubbles: true});
          inputElement.dispatchEvent(event);
        }
                `);
    } else if (view.id.match("meta")) {
      view.webContents.executeJavaScript(`
                var inputElement = document.querySelector('textarea');
		if (inputElement) {
                var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                nativeTextAreaValueSetter.call(inputElement, \`${prompt}\`);

              const inputEvent = new Event('input', { bubbles: true });
              inputElement.dispatchEvent(inputEvent);
		};
                `);
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

        }
      `);
    } else if (view.id.match("deepseek")) {
      view.webContents.executeJavaScript(`
        var inputElement = document.querySelector('textarea');

        if (inputElement) {
          var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          nativeTextAreaValueSetter.call(inputElement, \`${prompt}\`);
        
          const inputEvent = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(inputEvent);           
        }
      `);
    }
  });
});

ipcMain.on("send-prompt", (event, prompt) => {
  views.forEach((view) => {
    if (view.id.match("openai")) {
      view.webContents.executeJavaScript(`
            var btn = document.querySelector('button[data-testid="send-button"]');
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
        btn.setAttribute("aria-disabled", "false"); // doesnt work alone
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
		var btn = document.querySelector("button[aria-label*='Send Message']"); // subsequent screens use this
    if (!btn) var btn = document.querySelector('button:has(div svg)'); // new chats use this
    if (!btn) var btn = document.querySelector('button:has(svg)'); // last ditch attempt
		if (btn) {
			btn.focus();
			btn.disabled = false;
			btn.click();
		}
  }`);
    } else if (view.id.match("meta")) {
      view.webContents.executeJavaScript(`{
          var btn = document.querySelector("div[aria-label*='Send Message'] path");

          // Check if the element exists to avoid errors
          if (btn) {
            // Create a new mouse event
            var event = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });

            // Dispatch the click event on the path element
            btn.dispatchEvent(event);
          } else {
            console.log("Element not found");
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
    } else if (view.id.match("grok")) {
      view.webContents.executeJavaScript(`
        {
        var btn = document.querySelector('button.group');

        if (btn) {
            btn.focus();
			      btn.disabled = false;
            btn.click();

          } else {
            console.log("Element not found");
          }

      }
        `);
    } else if (view.id.match("deepseek")) {
      view.webContents.executeJavaScript(`
        {
        var buttons = Array.from(document.querySelectorAll('div[role="button"]'));
        var btn = buttons[2]
        if (btn) {
            btn.focus();
            btn.disabled = false;
            btn.click();

          } else {
            console.log("Element not found");
          }
    }
        `);
    }
  });
});

ipcMain.on("open-perplexity", (event, prompt) => {
  if (prompt === "open perplexity now") {
    console.log("Opening Perplexity");
    let url = "https://www.perplexity.ai/";

    addBrowserView(mainWindow, url, websites, views);
  }
});

ipcMain.on("close-perplexity", (event, prompt) => {
  if (prompt === "close perplexity now") {
    console.log("Closing Perplexity");
    const perplexityView = views.find((view) => view.id.match("perplexity"));
    removeBrowserView(mainWindow, perplexityView, websites, views);
  }
});

ipcMain.on("open-claude", (event, prompt) => {
  if (prompt === "open claude now") {
    console.log("Opening Claude");
    let url = "https://claude.ai/chats/";

    addBrowserView(mainWindow, url, websites, views);
  }
});

ipcMain.on("close-claude", (event, prompt) => {
  if (prompt === "close claude now") {
    console.log("Closing Claude");

    const claudeView = views.find((view) => view.id.match("claude"));
    removeBrowserView(mainWindow, claudeView, websites, views);
  }
});

ipcMain.on("open-grok", (event, prompt) => {
  if (prompt === "open grok now") {
    console.log("Opening Grok");
    let url = "https://grok.com/";

    addBrowserView(mainWindow, url, websites, views);
  }
});

ipcMain.on("close-grok", (event, prompt) => {
  if (prompt === "close grok now") {
    console.log("Closing Grok");

    const grokView = views.find((view) => view.id.match("grok"));

    removeBrowserView(mainWindow, grokView, websites, views);
  }
});

ipcMain.on("open-deepseek", (event, prompt) => {
  if (prompt === "open deepseek now") {
    console.log("Opening DeepSeek");
    let url = "https://chat.deepseek.com/";

    addBrowserView(mainWindow, url, websites, views);
  }
});

ipcMain.on("close-deepseek", (event, prompt) => {
  if (prompt === "close deepseek now") {
    console.log("Closing Deepseek");

    const deepseekView = views.find((view) => view.id.match("deepseek"));
    removeBrowserView(mainWindow, deepseekView, websites, views);
  }
});
