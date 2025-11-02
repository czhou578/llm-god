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

  // Set background color to prevent white flash while loading
  view.setBackgroundColor("#000000");

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
  return (
    text
      // Remove emojis (emoticons, symbols, pictographs, transport symbols, flags, etc.)
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") // Misc Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // Transport and Map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "") // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, "") // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, "") // Dingbats
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, "") // Supplemental Symbols and Pictographs
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "") // Chess Symbols
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "") // Symbols and Pictographs Extended-A
      .replace(/[\u{FE00}-\u{FE0F}]/gu, "") // Variation Selectors
      .replace(/[\u{200D}]/gu, "") // Zero Width Joiner (used in emoji sequences)
      .trim()
  );
}

export function openNewChatInView(view: CustomBrowserView): void {
  if (view.id && view.id.match("chatgpt")) {
    view.webContents.executeJavaScript(`
      (function() {
        const selectors = [
          'a[aria-label="New chat"]',
          'button[aria-label="New chat"]',
          'a[href*="/"]', // ChatGPT new chat links
          'button:has(svg[class*="icon"])'
        ];
        
        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              // Check if visible and interactable
              if (element.offsetParent !== null && 
                  element.getBoundingClientRect().width > 0) {
                const text = element.textContent?.toLowerCase() || '';
                const label = element.getAttribute('aria-label')?.toLowerCase() || '';
                
                if (label.includes('new') || text.includes('new chat')) {
                  element.click();
                  return true;
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        // Final fallback: look for any clickable element with "new chat" text
        const allClickable = document.querySelectorAll('a, button');
        for (const el of allClickable) {
          if (el.offsetParent !== null) {
            const text = (el.textContent || '').toLowerCase();
            const label = (el.getAttribute('aria-label') || '').toLowerCase();
            if (label === 'new chat' || text.trim() === 'new chat') {
              el.click();
              return true;
            }
          }
        }
      })();
    `);
  } else if (
    (view.id && view.id.match("bard")) ||
    (view.id && view.id.match("gemini"))
  ) {
    view.webContents.executeJavaScript(`
            (function() {
                const newChatButton = document.querySelector('button[aria-label="New chat"]');
                if (newChatButton) {
                    newChatButton.click();
                }
            })();
        `);
  } else if (view.id && view.id.match("claude")) {
    view.webContents.executeJavaScript(`
      (function() {
        const selectors = [
          'a[aria-label="New chat"]',
          'button[aria-label="New chat"]',
          'a[href*="new"]',
          'div[role="button"]:has-text("New")'
        ];
        
        for (const selector of selectors) {
          try {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null && 
                element.getBoundingClientRect().width > 0) {
              element.click();
              return true;
            }
          } catch (e) {
            continue;
          }
        }
        
        // Fallback
        const clickables = Array.from(document.querySelectorAll('a, button, div[role="button"]'));
        const newChatBtn = clickables.find(el => {
          if (el.offsetParent === null) return false;
          const label = (el.getAttribute('aria-label') || '').toLowerCase();
          const text = (el.textContent || '').toLowerCase();
          return label.includes('new') || text.trim().includes('new chat');
        });
        if (newChatBtn) {
          newChatBtn.click();
        }
      })();
    `);
  } else if (view.id && view.id.match("grok")) {
    view.webContents.executeJavaScript(`
      (function() {
        // Try specific selector first
        let element = document.querySelector('a[data-sidebar="menu-button"]');
        if (element && element.offsetParent !== null && 
            element.getBoundingClientRect().width > 0) {
          element.click();
          return true;
        }
        
        // Try all menu buttons
        const menuButtons = document.querySelectorAll('a[data-sidebar="menu-button"]');
        for (const btn of menuButtons) {
          if (btn.offsetParent !== null && btn.getBoundingClientRect().width > 0) {
            btn.click();
            return true;
          }
        }
        
        // Fallback: look for "new" in links
        const links = Array.from(document.querySelectorAll('a'));
        const newChatLink = links.find(link => {
          if (link.offsetParent === null) return false;
          const text = (link.textContent || '').toLowerCase();
          const label = (link.getAttribute('aria-label') || '').toLowerCase();
          return text.includes('new') || label.includes('new');
        });
        if (newChatLink) {
          newChatLink.click();
        }
      })();
    `);
  } else if (view.id && view.id.match("deepseek")) {
    view.webContents.executeJavaScript(`
            (function() {
                const newChatButton = document.getElementsByClassName('ds-icon-button')[1];
                if (newChatButton) {
                    newChatButton.click();
                }
            })();
        `);
  } else if (view.id && view.id.match("copilot")) {
    view.webContents.executeJavaScript(`
      (function() {
        const selectors = [
          'button[aria-label="Start new chat"]',
          'button[aria-label*="new chat" i]',
          'button[aria-label*="New" i]',
          'button:has(svg)'
        ];
        
        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              if (element.offsetParent !== null && 
                  element.getBoundingClientRect().width > 0 &&
                  !element.disabled) {
                const label = (element.getAttribute('aria-label') || '').toLowerCase();
                if (label.includes('new') || label.includes('start')) {
                  element.click();
                  return true;
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        // Fallback
        const buttons = Array.from(document.querySelectorAll('button'));
        const newChatBtn = buttons.find(btn => {
          if (btn.disabled || btn.offsetParent === null) return false;
          const label = (btn.getAttribute('aria-label') || '').toLowerCase();
          return label.includes('new') || label.includes('start');
        });
        if (newChatBtn) {
          newChatBtn.click();
        }
      })();
    `);
  }
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
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
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
  } else if (
    (view.id && view.id.match("bard")) ||
    (view.id && view.id.match("gemini"))
  ) {
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
                    const inputEvent = new Event('input', { bubbles: true });
                    if (inputElement.tagName === 'TEXTAREA') {
                        inputElement.value = \`${escapedPrompt}\`;
                    } else {
                        inputElement.innerText = \`${escapedPrompt}\`;
                    }
                    inputElement.dispatchEvent(inputEvent);
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
  } else if (view.id && view.id.match("copilot")) {
    view.webContents.executeJavaScript(`
            {
                var inputElement = document.querySelector('textarea[aria-label="Ask me anything..."]');
                if (!inputElement) inputElement = document.querySelector('textarea');
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
                var btn = document.querySelector('button[data-testid="send-button"]');
                if (!btn) btn = document.querySelector('button[aria-label*="Send"]');
                if (!btn) btn = document.querySelector('button[data-testid="fruitjuice-send-button"]');
                if (!btn) {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    btn = buttons.find(b => {
                        const svg = b.querySelector('svg');
                        return svg && b.closest('form') && !b.disabled;
                    });
                }

                if (btn) {
                    btn.disabled = false;
                    btn.click();
                }
            })();
        `);
  } else if (
    (view.id && view.id.match("bard")) ||
    (view.id && view.id.match("gemini"))
  ) {
    view.webContents.executeJavaScript(`
      (function() {
        var btn = document.querySelector("button[aria-label*='Send message']");
        if (!btn) btn = document.querySelector("button[aria-label*='Send']");
        if (!btn) btn = document.querySelector("button[mattooltip*='Send']");
        if (!btn) btn = document.querySelector("button.send-button");
        if (!btn) {
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
          btn.setAttribute("aria-disabled", "false");
          btn.disabled = false;
          btn.click();
        }
      })();
    `);
  } else if (view.id && view.id.match("claude")) {
    view.webContents.executeJavaScript(`
      (function() {
        var btn = document.querySelector("button[aria-label*='Send message']");
        if (!btn) btn = document.querySelector("button[aria-label*='Send Message']");
        if (!btn) btn = document.querySelector('button:has(div svg)');
        if (!btn) btn = document.querySelector('button:has(svg)');
        if (!btn) {
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
          btn.disabled = false;
          btn.click();
        }
      })();
    `);
  } else if (view.id && view.id.match("grok")) {
    view.webContents.executeJavaScript(`
      (function() {
        const textarea = document.querySelector('textarea');
        var btn = document.querySelector('button[aria-label*="Submit"]');
        if (!btn) btn = document.querySelector('button[aria-label*="Send"]');
        if (!btn) btn = document.querySelector('button[data-testid="send-button"]');
        if (!btn && textarea) {
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
          btn.disabled = false;
          btn.click();

          setTimeout(() => {
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            btn.dispatchEvent(clickEvent);
          }, 50);

          if (textarea) {
            setTimeout(() => {
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
        }
      })();
    `);
  } else if (view.id && view.id.match("deepseek")) {
    view.webContents.executeJavaScript(`
      (function() {
        var btn = null;
        const textarea = document.querySelector('textarea');

        if (textarea) {
          let container = textarea.parentElement;
          while (container && !container.querySelector('div.ds-icon-button[role="button"]')) {
            container = container.parentElement;
            if (container === document.body) break;
          }

          if (container) {
            const buttons = Array.from(container.querySelectorAll('div.ds-icon-button[role="button"]'));
            const textareaRect = textarea.getBoundingClientRect();

            const candidateButtons = buttons
              .map(b => {
                const btnRect = b.getBoundingClientRect();
                const isDisabled = b.getAttribute('aria-disabled') === 'true';
                const hasSVG = !!b.querySelector('svg');
                const distance = Math.abs(btnRect.top - textareaRect.top) + Math.abs(btnRect.left - textareaRect.left);
                const isNearby = distance < 700;
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
              .filter(info => info.hasSVG && !info.isDisabled && info.isNearby && !info.hasDirectFileInput);

            if (candidateButtons.length > 0) {
              btn = candidateButtons.reduce((rightmost, current) => {
                return current.rect.left > rightmost.rect.left ? current : rightmost;
              }).button;
            }
          }
        }

        if (btn) {
          btn.setAttribute('aria-disabled', 'false');
          btn.click();
        }
      })();
    `);
  } else if (view.id && view.id.match("copilot")) {
    view.webContents.executeJavaScript(`
      (function() {
        const textarea = document.querySelector('textarea');
        const allButtons = document.querySelectorAll('button');

        var btn = Array.from(allButtons).find(b => {
          const label = b.getAttribute('aria-label');
          return label && label.toLowerCase().includes('submit');
        });

        if (!btn && textarea) {
          const form = textarea.closest('form');
          if (form) {
            const buttons = form.querySelectorAll('button');
            btn = Array.from(buttons).find(b => {
              const svg = b.querySelector('svg');
              const isSubmit = b.type === 'submit';
              return (svg || isSubmit) && !b.disabled;
            });
          }
        }

        if (btn) {
          btn.disabled = false;
          btn.click();
        } else if (textarea) {
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          textarea.dispatchEvent(enterEvent);
        }
      })();
    `);
  }
}
