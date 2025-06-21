import { WebContentsView } from "electron"; // Added WebPreferences type
/**
 * Creates and configures a new BrowserView for the main window
 * @param mainWindow - The main Electron window
 * @param url - The URL to load in the browser view
 * @param websites - Array of currently open website URLs
 * @param views - Array of currently open BrowserViews
 * @param webPreferences - Optional web preferences for the BrowserView
 * @returns The newly created BrowserView
 */
export function addBrowserView(mainWindow, url, websites, views, webPreferences = {}) {
    const view = new WebContentsView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            devTools: true,
            ...webPreferences,
        },
    });
    view.id = url;
    mainWindow.contentView.addChildView(view);
    const { width, height } = mainWindow.getBounds();
    websites.push(url);
    const viewWidth = Math.floor(width / websites.length);
    views.forEach((v, index) => {
        v.setBounds({
            x: index * viewWidth,
            y: 0,
            width: viewWidth,
            height: height - 235,
        });
    });
    view.setBounds({
        x: (websites.length - 1) * viewWidth,
        y: 0,
        width: viewWidth,
        height: height - 235,
    });
    view.webContents.setZoomFactor(1.5);
    view.webContents.loadURL(url);
    views.push(view);
    return view;
}
export function removeBrowserView(mainWindow, viewToRemove, // Changed to viewToRemove for clarity
websites, views) {
    const viewIndex = views.indexOf(viewToRemove);
    if (viewIndex === -1)
        return;
    mainWindow.contentView.removeChildView(viewToRemove);
    const urlIndex = websites.findIndex((url) => url === viewToRemove.id);
    if (urlIndex !== -1) {
        websites.splice(urlIndex, 1);
    }
    views.splice(viewIndex, 1);
    if (views.length === 0)
        return;
    const { width, height } = mainWindow.getBounds();
    const viewWidth = Math.floor(width / views.length);
    views.forEach((v, index) => {
        v.setBounds({
            x: index * viewWidth,
            y: 0,
            width: viewWidth,
            height: height - 235,
        });
    });
}
export function injectPromptIntoView(view, prompt) {
    if (view.id && view.id.match("chatgpt")) {
        view.webContents.executeJavaScript(`
            (function() {
                const inputElement = document.querySelector('#prompt-textarea > p');
                if (inputElement) {
                    const inputEvent = new Event('input', { bubbles: true });
                    inputElement.innerText = \`${prompt}\`;
                    inputElement.dispatchEvent(inputEvent);
                }
            })();
        `);
    }
    else if (view.id && view.id.match("bard")) {
        view.webContents.executeJavaScript(`
            {
                var inputElement = document.querySelector(".ql-editor.textarea");
                if (inputElement) {
                    const inputEvent = new Event('input', { bubbles: true });
                    inputElement.value = \`${prompt}\`;
                    inputElement.dispatchEvent(inputEvent);
                    inputElement.querySelector('p').textContent = \`${prompt}\`;
                }
            }
        `);
    }
    else if (view.id && view.id.match("perplexity")) {
        view.webContents.executeJavaScript(`
            var inputElement = document.querySelector('textarea[placeholder*="Ask"]');
            if (inputElement) {
                var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                nativeTextAreaValueSetter.call(inputElement, \`${prompt}\`);
                var event = new Event('input', { bubbles: true });
                inputElement.dispatchEvent(event);
            }
        `);
    }
    else if (view.id && view.id.match("claude")) {
        view.webContents.executeJavaScript(`
            {
                var inputElement = document.querySelector('div.ProseMirror');
                if (inputElement) {
                    inputElement.innerHTML = \`${prompt}\`;
                }
            }
        `);
    }
    else if (view.id && view.id.match("grok")) {
        view.webContents.executeJavaScript(`
            {
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
            }
        `);
    }
    else if (view.id && view.id.match("deepseek")) {
        view.webContents.executeJavaScript(`
            {
                var inputElement = document.querySelector('textarea');
                if (inputElement) {
                    var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                    nativeTextAreaValueSetter.call(inputElement, \`${prompt}\`);
                    const inputEvent = new Event('input', { bubbles: true });
                    inputElement.dispatchEvent(inputEvent);
                }
            }
        `);
    }
    else if (view.id && view.id.match("lmarena")) {
        view.webContents.executeJavaScript(`
            {
                var inputElement = document.querySelector('textarea');
                if (inputElement) {
                    var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                    nativeTextAreaValueSetter.call(inputElement, \`${prompt}\`);
                    const inputEvent = new Event('input', { bubbles: true });
                    inputElement.dispatchEvent(inputEvent);
                }
        }
    `);
    }
}
export function sendPromptInView(view) {
    if (view.id && view.id.match("chatgpt")) {
        view.webContents.executeJavaScript(`
            var btn = document.querySelector('button[aria-label*="Send prompt"]');
            if (btn) {
                btn.focus();
                btn.disabled = false;
                btn.click();
            }
        `);
    }
    else if (view.id && view.id.match("bard")) {
        view.webContents.executeJavaScript(`{
      var btn = document.querySelector("button[aria-label*='Send message']");
      if (btn) {
        btn.setAttribute("aria-disabled", "false");
        btn.focus();
        btn.click();
      }
    }`);
    }
    else if (view.id && view.id.match("perplexity")) {
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
    else if (view.id && view.id.match("claude")) {
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
    }
    else if (view.id && view.id.match("grok")) {
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
    }
    else if (view.id && view.id.match("deepseek")) {
        view.webContents.executeJavaScript(`
        {
        var buttons = Array.from(document.querySelectorAll('div[role="button"]'));
        var btn = buttons[2]
        if (btn) {
            btn.focus();
            btn.click();
          } else {
            console.log("Element not found");
          }
    }`);
    }
    else if (view.id && view.id.match("lmarena")) {
        view.webContents.executeJavaScript(`
        {
        var btn = document.querySelector('button[type="submit"]');
        if (btn) {
            btn.focus();
            btn.disabled = false;
            btn.click();
          } else {
            console.log("Element not found");
          }
    }`);
    }
}
