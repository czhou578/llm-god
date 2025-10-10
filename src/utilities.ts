import { BrowserWindow, WebPreferences, WebContentsView } from "electron"; // Added WebPreferences type

interface CustomBrowserView extends WebContentsView {
  id?: string; // Make id optional as it's assigned after creation
}

/**
 * Creates and configures a new BrowserView for the main window
 * @param mainWindow - The main Electron window
 * @param url - The URL to load in the browser view
 * @param websites - Array of currently open website URLs
 * @param views - Array of currently open BrowserViews
 * @param webPreferences - Optional web preferences for the BrowserView
 * @returns The newly created BrowserView
 */
export function addBrowserView(
  mainWindow: BrowserWindow,
  url: string,
  websites: string[],
  views: CustomBrowserView[],
  webPreferences: WebPreferences = {},
): CustomBrowserView {
  const view: CustomBrowserView = new WebContentsView({
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

  // Open DevTools for debugging
  // view.webContents.openDevTools({ mode: "detach" });

  views.push(view);
  return view;
}

export function removeBrowserView(
  mainWindow: BrowserWindow,
  viewToRemove: CustomBrowserView, // Changed to viewToRemove for clarity
  websites: string[],
  views: CustomBrowserView[],
): void {
  const viewIndex = views.indexOf(viewToRemove);
  if (viewIndex === -1) return;

  mainWindow.contentView.removeChildView(viewToRemove);

  const urlIndex = websites.findIndex((url) => url === viewToRemove.id);
  if (urlIndex !== -1) {
    websites.splice(urlIndex, 1);
  }

  views.splice(viewIndex, 1);

  if (views.length === 0) return;

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
export function stripEmojis(text: string): string {
  return text
    // Remove emojis (emoticons, symbols, pictographs, transport symbols, flags, etc.)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{200D}]/gu, '')            // Zero Width Joiner (used in emoji sequences)
    .trim();
}

export function injectPromptIntoView(
  view: CustomBrowserView,
  prompt: string,
): void {
  // Strip emojis from the prompt before injection
  const cleanPrompt = stripEmojis(prompt);
  
  // Properly escape the prompt for use in template literals
  const escapeForJS = (str: string): string => {
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
                    console.log("ChatGPT: Found input element, injecting prompt...");
                    const inputEvent = new Event('input', { bubbles: true });
                    inputElement.innerText = \`${escapedPrompt}\`;
                    inputElement.dispatchEvent(inputEvent);
                } else {
                    console.error("ChatGPT: Input element not found!");
                }
            })();
        `);
  } else if (view.id && view.id.match("bard") || view.id && view.id.match("gemini")) {
    view.webContents.executeJavaScript(`
            {
                var inputElement = document.querySelector(".ql-editor.textarea");
                if (!inputElement) {
                    inputElement = document.querySelector("rich-textarea textarea");
                }
                if (!inputElement) {
                    inputElement = document.querySelector("[contenteditable='true']");
                }
                if (inputElement) {
                    console.log("Gemini/Bard: Found input element, injecting prompt...");
                    const inputEvent = new Event('input', { bubbles: true });
                    if (inputElement.tagName === 'TEXTAREA') {
                        inputElement.value = \`${escapedPrompt}\`;
                    } else {
                        inputElement.innerText = \`${escapedPrompt}\`;
                    }
                    inputElement.dispatchEvent(inputEvent);
                } else {
                    console.error("Gemini/Bard: Input element not found!");
                }
            }
        `);
  } else if (view.id && view.id.match("claude")) {
    view.webContents.executeJavaScript(`
            {
                var inputElement = document.querySelector('div.ProseMirror');
                if (inputElement) {
                    inputElement.innerHTML = \`${escapedPrompt}\`;
                }
            }
        `);
  } else if (view.id && view.id.match("grok")) {
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
  } else if (view.id && view.id.match("deepseek")) {
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
}

export function sendPromptInView(view: CustomBrowserView) {
  if (view.id && view.id.match("chatgpt")) {
    view.webContents.executeJavaScript(`
            (function() {
                // Try multiple selectors for ChatGPT send button
                var btn = document.querySelector('button[data-testid="send-button"]');
                if (!btn) btn = document.querySelector('button[aria-label*="Send"]');
                if (!btn) btn = document.querySelector('button[data-testid="fruitjuice-send-button"]');
                if (!btn) {
                    // Find button with SVG icon (send icon)
                    const buttons = Array.from(document.querySelectorAll('button'));
                    btn = buttons.find(b => {
                        const svg = b.querySelector('svg');
                        return svg && b.closest('form') && !b.disabled;
                    });
                }

                if (btn) {
                    console.log("ChatGPT: Found send button, clicking...");
                    btn.focus();
                    btn.disabled = false;
                    btn.click();
                } else {
                    console.error("ChatGPT: Send button not found!");
                    console.log("Available buttons with attributes:", Array.from(document.querySelectorAll('button')).map(b => ({
                        testid: b.getAttribute('data-testid'),
                        aria: b.getAttribute('aria-label'),
                        disabled: b.disabled,
                        hasSVG: !!b.querySelector('svg')
                    })));
                }
            })();
        `);
  } else if (view.id && view.id.match("bard") || view.id && view.id.match("gemini")) {
    view.webContents.executeJavaScript(`
      (function() {
        // Try multiple selectors for Gemini/Bard send button
        var btn = document.querySelector("button[aria-label*='Send message']");
        if (!btn) btn = document.querySelector("button[aria-label*='Send']");
        if (!btn) btn = document.querySelector("button[mattooltip*='Send']");
        if (!btn) btn = document.querySelector("button.send-button");
        if (!btn) {
          // Find button near textarea
          const textarea = document.querySelector('rich-textarea, textarea, [contenteditable="true"]');
          if (textarea) {
            const form = textarea.closest('form');
            if (form) {
              const buttons = form.querySelectorAll('button');
              btn = Array.from(buttons).find(b => {
                const svg = b.querySelector('svg');
                return svg && !b.disabled;
              });
            }
          }
        }

        if (btn) {
          console.log("Gemini/Bard: Found send button, clicking...");
          btn.setAttribute("aria-disabled", "false");
          btn.disabled = false;
          btn.focus();
          btn.click();
        } else {
          console.error("Gemini/Bard: Send button not found!");
          console.log("Available buttons:", Array.from(document.querySelectorAll('button')).map(b => ({
            aria: b.getAttribute('aria-label'),
            mat: b.getAttribute('mattooltip'),
            class: b.className,
            disabled: b.disabled,
            hasSVG: !!b.querySelector('svg')
          })));
        }
      })();
    `);
  } else if (view.id && view.id.match("claude")) {
    view.webContents.executeJavaScript(`
      (function() {
        // Try multiple selectors for Claude send button
        var btn = document.querySelector("button[aria-label*='Send message']");
        if (!btn) btn = document.querySelector("button[aria-label*='Send Message']");
        if (!btn) btn = document.querySelector('button:has(div svg)');
        if (!btn) btn = document.querySelector('button:has(svg)');
        if (!btn) {
          // Find button in the input area
          const inputArea = document.querySelector('[contenteditable="true"]');
          if (inputArea) {
            const container = inputArea.closest('div[class*="composer"]') || inputArea.closest('form') || inputArea.parentElement;
            if (container) {
              const buttons = container.querySelectorAll('button');
              btn = Array.from(buttons).find(b => {
                const svg = b.querySelector('svg');
                return svg && !b.disabled;
              });
            }
          }
        }

        if (btn) {
          console.log("Claude: Found send button, clicking...");
          btn.focus();
          btn.disabled = false;
          btn.click();
        } else {
          console.error("Claude: Send button not found!");
          console.log("Available buttons:", Array.from(document.querySelectorAll('button')).map(b => ({
            aria: b.getAttribute('aria-label'),
            class: b.className,
            disabled: b.disabled,
            hasSVG: !!b.querySelector('svg')
          })));
        }
      })();
    `);
  } else if (view.id && view.id.match("grok")) {
    view.webContents.executeJavaScript(`
      (function() {
        // Check if textarea has content
        const textarea = document.querySelector('textarea');
        if (textarea) {
          console.log("Grok: Textarea value:", textarea.value);
          console.log("Grok: Textarea length:", textarea.value.length);
        } else {
          console.error("Grok: Textarea not found!");
        }

        // Try multiple selectors for Grok send button
        var btn = document.querySelector('button[aria-label*="Submit"]');
        if (!btn) btn = document.querySelector('button[aria-label*="Send"]');
        if (!btn) btn = document.querySelector('button[data-testid="send-button"]');
        if (!btn && textarea) {
          // Find button near textarea
          const form = textarea.closest('form');
          if (form) {
            const buttons = form.querySelectorAll('button');
            btn = Array.from(buttons).find(b => {
              const svg = b.querySelector('svg');
              return svg && !b.disabled;
            });
          }
        }

        if (btn) {
          console.log("Grok: Found send button", btn);
          console.log("Grok: Button disabled:", btn.disabled);
          console.log("Grok: Button aria-label:", btn.getAttribute('aria-label'));

          // Try different approaches to trigger send
          btn.disabled = false;
          btn.focus();

          // Try clicking
          console.log("Grok: Attempting click...");
          btn.click();

          // Also try dispatching mouse events
          setTimeout(() => {
            console.log("Grok: Attempting MouseEvent...");
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            btn.dispatchEvent(clickEvent);
          }, 50);

          // Also try pressing Enter on textarea
          if (textarea) {
            setTimeout(() => {
              console.log("Grok: Attempting Enter key on textarea...");
              textarea.focus();
              const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true,
                cancelable: true
              });
              textarea.dispatchEvent(enterEvent);
            }, 100);
          }
        } else {
          console.error("Grok: Send button not found!");
          console.log("Available buttons:", Array.from(document.querySelectorAll('button')).map(b => ({
            aria: b.getAttribute('aria-label'),
            testid: b.getAttribute('data-testid'),
            disabled: b.disabled,
            hasSVG: !!b.querySelector('svg')
          })));
        }
      })();
    `);
  } else if (view.id && view.id.match("deepseek")) {
    view.webContents.executeJavaScript(`
      (function() {
        // DeepSeek: Find send button near textarea (not sidebar button)
        var btn = null;
        const textarea = document.querySelector('textarea');

        if (textarea) {
          // Get the closest container that includes both textarea and send button
          let container = textarea.parentElement;
          while (container && !container.querySelector('div.ds-icon-button[role="button"]')) {
            container = container.parentElement;
            if (container === document.body) break;
          }

          if (container) {
            // Find all icon buttons in this container
            const buttons = Array.from(container.querySelectorAll('div.ds-icon-button[role="button"]'));

            // Filter out buttons that are far from textarea (like sidebar buttons)
            const textareaRect = textarea.getBoundingClientRect();

            // Filter buttons to exclude file upload buttons and select the best candidate
            const candidateButtons = buttons
              .map(b => {
                const btnRect = b.getBoundingClientRect();
                const isDisabled = b.getAttribute('aria-disabled') === 'true';
                const hasSVG = !!b.querySelector('svg');
                const distance = Math.abs(btnRect.top - textareaRect.top) + Math.abs(btnRect.left - textareaRect.left);
                const isNearby = distance < 700;

                // Check if this button is directly wrapping a file input (file upload button)
                const hasDirectFileInput = b.querySelector('input[type="file"]') !== null;

                return {
                  button: b,
                  rect: btnRect,
                  isDisabled,
                  hasSVG,
                  distance,
                  isNearby,
                  hasDirectFileInput
                };
              })
              .filter(info => {
                console.log("DeepSeek: Checking button", {
                  disabled: info.isDisabled,
                  hasSVG: info.hasSVG,
                  distance: info.distance,
                  isNearby: info.isNearby,
                  hasDirectFileInput: info.hasDirectFileInput,
                  btnPos: {top: info.rect.top, left: info.rect.left},
                  textareaPos: {top: textareaRect.top, left: textareaRect.left}
                });

                // Accept buttons that are enabled, have SVG, nearby, and NOT file upload buttons
                return info.hasSVG && !info.isDisabled && info.isNearby && !info.hasDirectFileInput;
              });

            // Select the rightmost button (send buttons are typically on the right)
            if (candidateButtons.length > 0) {
              btn = candidateButtons.reduce((rightmost, current) => {
                return current.rect.left > rightmost.rect.left ? current : rightmost;
              }).button;
            }
          }
        }

        if (btn) {
          console.log("DeepSeek: Found send button, clicking...", btn);
          btn.setAttribute('aria-disabled', 'false');
          btn.click();
        } else {
          console.error("DeepSeek: Send button not found!");
          if (textarea) {
            console.log("Textarea found at:", textarea.getBoundingClientRect());
          } else {
            console.log("Textarea not found!");
          }
        }
      })();
    `);
  }
}
