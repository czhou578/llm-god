const ipcRenderer = window.electron.ipcRenderer;

// Add emoji stripping function (duplicate from utilities since renderer can't import from utilities)
function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    .trim();
}

export function logToWebPage(message: string): void {
  // Strip emojis before sending
  const cleanMessage = stripEmojis(message);

  const ipcRenderer = window.electron.ipcRenderer;
  ipcRenderer.send("enter-prompt", cleanMessage);
}

export function openClaudeMessage(message: string): void {
  ipcRenderer.send("open-claude", message);
}

export function closeClaudeMessage(message: string): void {
  ipcRenderer.send("close-claude", message);
}

export function openDeepSeekMessage(message: string): void {
  ipcRenderer.send("open-deepseek", message);
}

export function closeDeepSeekMessage(message: string): void {
  ipcRenderer.send("close-deepseek", message);
}

export function openGrokMessage(message: string): void {
  ipcRenderer.send("open-grok", message);
}

export function closeGrokMessage(message: string): void {
  ipcRenderer.send("close-grok", message);
}

export function openCopilotMessage(message: string): void {
  ipcRenderer.send("open-copilot", message);
}

export function closeCopilotMessage(message: string): void {
  ipcRenderer.send("close-copilot", message);
}

export function openChatGPTMessage(message: string): void {
  ipcRenderer.send("open-chatgpt", message);
}

export function closeChatGPTMessage(message: string): void {
  ipcRenderer.send("close-chatgpt", message);
}

export function openGeminiMessage(message: string): void {
  ipcRenderer.send("open-gemini", message);
}

export function closeGeminiMessage(message: string): void {
  ipcRenderer.send("close-gemini", message);
}

const textArea = document.getElementById(
  "prompt-input",
) as HTMLTextAreaElement | null;
const openClaudeButton = document.getElementById(
  "showClaude",
) as HTMLElement | null;
const openGrokButton = document.getElementById(
  "showGrok",
) as HTMLElement | null;
const openDeepSeekButton = document.getElementById(
  "showDeepSeek",
) as HTMLElement | null;
const openCopilotButton = document.getElementById(
  "showCopilot",
) as HTMLElement | null;
const openChatGPTButton = document.getElementById(
  "showChatGPT",
) as HTMLElement | null;
const openGeminiButton = document.getElementById(
  "showGemini",
) as HTMLElement | null;

const promptDropdownButton = document.querySelector(
  ".prompt-select",
) as HTMLButtonElement | null;
const modelSelectButton = document.querySelector(
  ".model-select",
) as HTMLButtonElement | null;
const themeToggleButton = document.querySelector(
  ".theme-toggle",
) as HTMLButtonElement | null;

const newChatToggleButton = document.querySelector(
  ".new-chat-toggle",
) as HTMLButtonElement | null;

const sendButton = document.querySelector(
  ".send-button",
) as HTMLButtonElement | null;

// Helper to update dropdown item status
function updateDropdownItemState(element: HTMLElement | null, isActive: boolean, modelName: string) {
  if (!element) return;

  // Update data attribute
  element.dataset.active = isActive.toString();

  // Update dot
  const dot = element.querySelector('.status-dot');
  if (dot) {
    dot.className = `status-dot ${isActive ? 'active' : 'inactive'}`;
  }

  // Update label
  const label = element.querySelector('.label');
  if (label) {
    label.textContent = modelName;
  }
}

// Check if views are currently open and set initial button text
window.addEventListener("DOMContentLoaded", async () => {
  const ipc = window.electron.ipcRenderer;
  const openViews = await ipc.invoke("get-open-views");

  if (openChatGPTButton) {
    const isChatGPTOpen =
      openViews && openViews.some((url: string) => url.includes("chatgpt"));
    updateDropdownItemState(openChatGPTButton, isChatGPTOpen, "ChatGPT");
  }

  if (openGeminiButton) {
    const isGeminiOpen =
      openViews && openViews.some((url: string) => url.includes("gemini"));
    updateDropdownItemState(openGeminiButton, isGeminiOpen, "Gemini");
  }

  if (openClaudeButton) {
    const isClaudeOpen =
      openViews && openViews.some((url: string) => url.includes("claude"));
    updateDropdownItemState(openClaudeButton, isClaudeOpen, "Claude");
  }

  if (openGrokButton) {
    const isGrokOpen =
      openViews && openViews.some((url: string) => url.includes("grok"));
    updateDropdownItemState(openGrokButton, isGrokOpen, "Grok");
  }

  if (openDeepSeekButton) {
    const isDeepSeekOpen =
      openViews && openViews.some((url: string) => url.includes("deepseek"));
    updateDropdownItemState(openDeepSeekButton, isDeepSeekOpen, "DeepSeek");
  }

  if (openCopilotButton) {
    const isCopilotOpen =
      openViews && openViews.some((url: string) => url.includes("copilot"));
    updateDropdownItemState(openCopilotButton, isCopilotOpen, "Copilot");
  }

  // Load saved theme preference
  const savedTheme = localStorage.getItem("theme");
  const promptArea = document.getElementById("prompt-area");
  if (savedTheme === "dark" && promptArea) {
    promptArea.classList.add("dark-mode");
    if (themeToggleButton) {
      themeToggleButton.textContent = "☀️";
    }
  }
});

if (openChatGPTButton) {
  openChatGPTButton.addEventListener("click", (event: MouseEvent) => {
    const isActive = openChatGPTButton.dataset.active === "true";
    if (!isActive) {
      openChatGPTMessage("open chatgpt now");
      updateDropdownItemState(openChatGPTButton, true, "ChatGPT");
    } else {
      closeChatGPTMessage("close chatgpt now");
      updateDropdownItemState(openChatGPTButton, false, "ChatGPT");
    }
  });
}

if (openGeminiButton) {
  openGeminiButton.addEventListener("click", (event: MouseEvent) => {
    const isActive = openGeminiButton.dataset.active === "true";
    if (!isActive) {
      openGeminiMessage("open gemini now");
      updateDropdownItemState(openGeminiButton, true, "Gemini");
    } else {
      closeGeminiMessage("close gemini now");
      updateDropdownItemState(openGeminiButton, false, "Gemini");
    }
  });
}

if (openClaudeButton) {
  openClaudeButton.addEventListener("click", (event: MouseEvent) => {
    const isActive = openClaudeButton.dataset.active === "true";
    if (!isActive) {
      openClaudeMessage("open claude now");
      updateDropdownItemState(openClaudeButton, true, "Claude");
    } else {
      closeClaudeMessage("close claude now");
      updateDropdownItemState(openClaudeButton, false, "Claude");
    }
  });
}

if (openGrokButton) {
  openGrokButton.addEventListener("click", (event: MouseEvent) => {
    const isActive = openGrokButton.dataset.active === "true";
    if (!isActive) {
      openGrokMessage("open grok now");
      updateDropdownItemState(openGrokButton, true, "Grok");
    } else {
      closeGrokMessage("close grok now");
      updateDropdownItemState(openGrokButton, false, "Grok");
    }
  });
}

if (openDeepSeekButton) {
  openDeepSeekButton.addEventListener("click", (event: MouseEvent) => {
    const isActive = openDeepSeekButton.dataset.active === "true";
    if (!isActive) {
      openDeepSeekMessage("open deepseek now");
      updateDropdownItemState(openDeepSeekButton, true, "DeepSeek");
    } else {
      closeDeepSeekMessage("close deepseek now");
      updateDropdownItemState(openDeepSeekButton, false, "DeepSeek");
    }
  });
}

if (openCopilotButton) {
  openCopilotButton.addEventListener("click", (event: MouseEvent) => {
    const isActive = openCopilotButton.dataset.active === "true";
    if (!isActive) {
      openCopilotMessage("open copilot now");
      updateDropdownItemState(openCopilotButton, true, "Copilot");
    } else {
      closeCopilotMessage("close copilot now");
      updateDropdownItemState(openCopilotButton, false, "Copilot");
    }
  });
}

// Function to update character and word counter
function updateCharCounter(text: string): void {
  const charCounterElement = document.getElementById("char-counter");
  if (charCounterElement) {
    const charCount = text.length;
    const wordCount =
      text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    charCounterElement.textContent = `${charCount} chars / ${wordCount} words`;
  }
}

if (textArea) {
  textArea.addEventListener("input", (event: Event) => {
    const value = (event.target as HTMLTextAreaElement).value;
    logToWebPage(value);
    updateCharCounter(value);
  });

  textArea.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.ctrlKey) {
      if (event.key === "Enter") {
        event.preventDefault();
        const promptText = textArea.value;
        if (promptText.trim()) {
          console.log("Ctrl + Enter pressed, sending prompt:", promptText);
          ipcRenderer.send("send-prompt", promptText);
          textArea.value = "";
          updateCharCounter("");
        }
      }
    }
  });

  textArea.addEventListener("paste", (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Data = reader.result;
            ipcRenderer.send("paste-image", base64Data);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  });
}

if (newChatToggleButton) {
  newChatToggleButton.addEventListener("click", (event: MouseEvent) => {
    console.log("New chat toggle button clicked");
    event.stopPropagation();
    ipcRenderer.send("new-chat");
  });
}

if (sendButton) {
  sendButton.addEventListener("click", (event: MouseEvent) => {
    console.log("Send button clicked");
    event.stopPropagation();
    if (textArea) {
      const promptText = textArea.value;
      if (promptText.trim()) {
        console.log("Button clicked, sending prompt:", promptText);
        ipcRenderer.send("send-prompt", promptText);
        textArea.value = "";
        updateCharCounter("");
      }
    }
  });
}

if (promptDropdownButton) {
  promptDropdownButton.addEventListener("click", (event: MouseEvent) => {
    console.log("Prompt dropdown button clicked");
    event.stopPropagation();
    ipcRenderer.send("open-form-window");
  });
}

if (modelSelectButton) {
  modelSelectButton.addEventListener("click", (event: MouseEvent) => {
    console.log("Model select button clicked");
    event.stopPropagation();
    ipcRenderer.send("open-model-selection-window");
  });
}

if (themeToggleButton) {
  themeToggleButton.addEventListener("click", (event: MouseEvent) => {
    const promptArea = document.getElementById("prompt-area");
    if (promptArea) {
      promptArea.classList.toggle("dark-mode");

      if (promptArea.classList.contains("dark-mode")) {
        themeToggleButton.textContent = "☀️";
        localStorage.setItem("theme", "dark");
      } else {
        themeToggleButton.textContent = "🌙";
        localStorage.setItem("theme", "light");
      }
    }
  });
}

// Update the inject-prompt handler
ipcRenderer.on("inject-prompt", (_: any, selectedPrompt: string) => {
  console.log("Injecting prompt into textarea:", selectedPrompt);

  const injectPrompt = () => {
    const promptInput = document.getElementById(
      "prompt-input",
    ) as HTMLTextAreaElement;

    if (promptInput) {
      // Strip emojis before injecting
      const cleanPrompt = stripEmojis(selectedPrompt);

      console.log("Textarea found, injecting prompt");
      promptInput.value = cleanPrompt;
      promptInput.focus();

      const inputEvent = new Event("input", { bubbles: true });
      promptInput.dispatchEvent(inputEvent);

      updateCharCounter(cleanPrompt);

      console.log("Prompt injected successfully");
    } else {
      console.error("Textarea not found, retrying...");
      setTimeout(injectPrompt, 100);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectPrompt);
  } else {
    injectPrompt();
  }
});
