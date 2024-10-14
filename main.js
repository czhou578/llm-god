const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const remote = require("@electron/remote/main");
const path = require("path");
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

// app.disableHardwareAcceleration();

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("enter-prompt", (event, prompt) => {
  views.forEach((view) => {
    if (view.id.match("openai")) {
      view.webContents.executeJavaScript(`
        {
            // var inputElement = document.querySelector('#prompt-textarea');

            const inputElement = document.querySelector('#prompt-textarea > p');;
            if (inputElement) {
              const inputEvent = new Event('input', { bubbles: true });
              inputElement.innerHTML = \`${prompt}\`; // must be escaped backticks to support multiline
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
    }
  });
});

ipcMain.on("send-prompt", (event, prompt) => {
  views.forEach((view) => {
    if (view.id.match("openai")) {
      view.webContents.executeJavaScript(`
            // var btn = document.querySelector("textarea[placeholder*='Send a message']+button"); // this one broke recently .. note that they add another div (for the file upload) in code interpreter mode
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
    }
  });
});

ipcMain.on("open-perplexity", (event, prompt) => {
  if (prompt === "open perplexity now") {
    console.log("Opening Perplexity");
    let url = "https://www.perplexity.ai/";

    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: false,
        devTools: true,
      },
    });

    view.id = url;
    mainWindow.addBrowserView(view);
    // mainWindow.webContents.openDevTools()
    // Recalculate view dimensions
    const { width, height } = mainWindow.getBounds();

    websites.push(url);
    const viewWidth = Math.floor(width / websites.length);

    // Update bounds for all views
    views.forEach((v, index) => {
      v.setBounds({
        x: index * viewWidth,
        y: 0,
        width: viewWidth,
        // height: 100
        height: height - 200,
      });
    });

    // Set bounds for new view
    view.setBounds({
      x: (websites.length - 1) * viewWidth,
      y: 0,
      width: viewWidth,
      // height: 100
      height: height - 200,
    });

    view.webContents.setZoomFactor(1.5); // Set initial zoom factor to 150%
    view.webContents.loadURL(url);
    views.push(view);

    // Bring the new view to the front
    mainWindow.setTopBrowserView(view);
  }
});

ipcMain.on("close-perplexity", (event, prompt) => {
  if (prompt === "close perplexity now") {
    const perplexityView = views[3];
    mainWindow.removeBrowserView(perplexityView);
    views.pop();
    websites.pop();

    const { width, height } = mainWindow.getBounds();
    const viewWidth = Math.floor(width / websites.length);
    views.forEach((v, index) => {
      v.setBounds({
        x: index * viewWidth,
        y: 0,
        width: viewWidth,
        height: height - 200,
      });
    });
  }
});

ipcMain.on("open-claude", (event, prompt) => {
  if (prompt === "open claude now") {
    console.log("Opening Claude");
    let url = "https://claude.ai/chats/";

    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: false,
        devTools: true,
      },
    });

    view.id = url;
    mainWindow.addBrowserView(view);
    // mainWindow.webContents.openDevTools()
    // Recalculate view dimensions
    const { width, height } = mainWindow.getBounds();

    websites.push(url);
    const viewWidth = Math.floor(width / websites.length);

    // Update bounds for all views
    views.forEach((v, index) => {
      v.setBounds({
        x: index * viewWidth,
        y: 0,
        width: viewWidth,
        // height: 100
        height: height - 200,
      });
    });

    // Set bounds for new view
    view.setBounds({
      x: (websites.length - 1) * viewWidth,
      y: 0,
      width: viewWidth,
      // height: 100
      height: height - 200,
    });

    view.webContents.setZoomFactor(1.5); // Set initial zoom factor to 150%
    view.webContents.loadURL(url);
    views.push(view);

    // Bring the new view to the front
    mainWindow.setTopBrowserView(view);
  }
});

ipcMain.on("close-claude", (event, prompt) => {
  if (prompt === "close claude now") {
    const claudeView = views[3];
    mainWindow.removeBrowserView(claudeView);
    views.pop();
    websites.pop();

    const { width, height } = mainWindow.getBounds();
    const viewWidth = Math.floor(width / websites.length);
    views.forEach((v, index) => {
      v.setBounds({
        x: index * viewWidth,
        y: 0,
        width: viewWidth,
        height: height - 200,
      });
    });
  }
});
