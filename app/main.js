const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");

let mainWindow;
const views = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");

  const websites = [
    "https://chat.openai.com/",
    "https://bard.google.com",
    "https://claude.ai/chats/",
  ];

  const viewWidth = Math.floor(mainWindow.getBounds().width / websites.length);
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
      height: 600,
    });
    view.webContents.setZoomFactor(1); // Set initial zoom factor to 150%
    view.webContents.loadURL(url);
    ipcMain.on("console-log", (event, message) => {
      view.webContents.executeJavaScript(
        `console.log(${JSON.stringify(message)})`,
      );
    });
    views.push(view);
  });

  mainWindow.on("enter-full-screen", () => {
    updateZoomFactor();
  });

  mainWindow.on("resize", () => {
    const { width, height } = mainWindow.getBounds();
    const viewWidth = Math.floor(width / websites.length);
    views.forEach((view, index) => {
      view.setBounds({
        x: index * viewWidth,
        y: 0,
        width: viewWidth,
        height: height - 100,
      });
    });
    updateZoomFactor();
  });
}

function updateZoomFactor() {
  const bounds = mainWindow.getBounds();
  views.forEach((view) => {
    view.webContents.setZoomFactor(2);
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("enter-prompt", (event, prompt) => {
  views.forEach((view) => {
    console.log(view.id);
    if (view.id.match("openai")) {
      view.webContents.executeJavaScript(`
        {
            var inputElement = document.querySelector('#prompt-textarea');
            if (inputElement) {
              const inputEvent = new Event('input', { bubbles: true });
              inputElement.value = \`${prompt}\`; // must be escaped backticks to support multiline
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
                var inputElement = document.querySelector    
            
                `);
    } else if (view.id.match("claude")) {
      view.webContents.executeJavaScript(`{
    var inputElement = document.querySelector('div.ProseMirror')
		if (inputElement) {
			inputElement.innerHTML = \`${prompt}\`
		}
	}`);
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
    }
  });
});
