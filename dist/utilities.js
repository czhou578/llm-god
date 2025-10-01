import { WebContentsView, clipboard } from "electron"; // Added WebPreferences type
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
/**
 * Removes all emojis and special Unicode characters from a string
 */
export function stripEmojis(text) {
    return text
        // Remove emojis (emoticons, symbols, pictographs, transport symbols, flags, etc.)
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
        .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
        .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
        .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
        .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
        .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation Selectors
        .replace(/[\u{200D}]/gu, '') // Zero Width Joiner (used in emoji sequences)
        .trim();
}
export function injectPromptIntoView(view, prompt) {
    // Strip emojis from the prompt before injection
    const cleanPrompt = stripEmojis(prompt);
    // Properly escape the prompt for use in template literals
    const escapeForJS = (str) => {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    };
    const escapedPrompt = escapeForJS(cleanPrompt);
    if (view.id && view.id.match("chatgpt")) {
        view.webContents.executeJavaScript(`
            (function() {
                const inputElement = document.querySelector('#prompt-textarea > p');
                if (inputElement) {
                    const inputEvent = new Event('input', { bubbles: true });
                    inputElement.innerText = \`${escapedPrompt}\`;
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
                    inputElement.value = \`${escapedPrompt}\`;
                    inputElement.dispatchEvent(inputEvent);
                    inputElement.querySelector('p').textContent = \`${escapedPrompt}\`;
                }
            }
        `);
    }
    else if (view.id && view.id.match("perplexity")) {
        // Copy to clipboard
        clipboard.writeText(escapedPrompt);
        // Focus the input element first, then paste using Electron's native paste
        view.webContents.executeJavaScript(`
        (function() {
            console.log('=== Perplexity Native Paste ===');
            
            var inputElement = document.querySelector('div[aria-placeholder="Ask anything…"]');
            if (!inputElement) {
                console.error('Input element not found');
                return;
            }
            
            console.log('Step 1 - Found input element');
            
            // Focus the element
            inputElement.focus();
            inputElement.click();
            console.log('Step 2 - Focused element - ready for paste');
        })();
    `).then(() => {
            // After focusing, use Electron's native paste command
            setTimeout(() => {
                view.webContents.paste(); // This is Electron's native paste method
                console.log('Triggered native paste');
                // Verify after paste
                setTimeout(() => {
                    view.webContents.executeJavaScript(`
                    var spanElement = document.querySelector('span[data-lexical-text="true"]');
                    console.log('=== Final State ===');
                    console.log('Span text:', spanElement ? spanElement.textContent : 'not found');
                `);
                }, 200);
            }, 100);
        });
    }
    else if (view.id && view.id.match("claude")) {
        view.webContents.executeJavaScript(`
            {
                var inputElement = document.querySelector('div.ProseMirror');
                if (inputElement) {
                    inputElement.innerHTML = \`${escapedPrompt}\`;
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
                    nativeTextAreaValueSetter.call(inputElement, \`${escapedPrompt}\`);
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
                    nativeTextAreaValueSetter.call(inputElement, \`${escapedPrompt}\`);
                    const inputEvent = new Event('input', { bubbles: true });
                    inputElement.dispatchEvent(inputEvent);
                }
            }
        `);
    }
    else if (view.id && view.id.match("lmarena")) {
        const escapedescapedPrompt = prompt.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\n/g, '\\n');
        view.webContents.executeJavaScript(`
        (function() {
            console.log('=== LM Arena Persistent Injection ===');
            
            var inputElement = document.querySelector('textarea[name="message"]');
            if (!inputElement) {
                console.error('Textarea not found');
                return;
            }
            
            var targetValue = \`${escapedPrompt}\`;
            var nativeValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, 
                "value"
            ).set;
            
            var attemptCount = 0;
            var maxAttempts = 50; // Try for up to 5 seconds
            var isStable = false;
            
            // Function to set the value
            function setValue() {
                if (inputElement.value !== targetValue) {
                    nativeValueSetter.call(inputElement, targetValue);
                    var inputEvent = new Event('input', { bubbles: true });
                    inputElement.dispatchEvent(inputEvent);
                    console.log('Attempt', attemptCount, '- Set value to:', inputElement.value);
                }
            }
            
            // Set initial value
            inputElement.focus();
            setValue();
            
            // Use MutationObserver to watch for React clearing the value
            var observer = new MutationObserver(function(mutations) {
                if (!isStable && inputElement.value !== targetValue) {
                    console.log('React cleared the value, re-setting...');
                    setValue();
                }
            });
            
            observer.observe(inputElement, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            });
            
            // Also use setInterval as backup
            var interval = setInterval(function() {
                attemptCount++;
                
                if (inputElement.value === targetValue) {
                    console.log('Value is stable!');
                    isStable = true;
                    clearInterval(interval);
                    observer.disconnect();
                    return;
                }
                
                if (attemptCount >= maxAttempts) {
                    console.error('Failed to set value after', maxAttempts, 'attempts');
                    clearInterval(interval);
                    observer.disconnect();
                    return;
                }
                
                setValue();
            }, 100); // Check every 100ms
            
            console.log('Started persistent injection');
        })();
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
