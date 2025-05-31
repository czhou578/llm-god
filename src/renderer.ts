const ipcRenderer = window.electron.ipcRenderer;

export function logToWebPage(message: string): void {
  ipcRenderer.send("enter-prompt", message);
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

const textArea = document.getElementById(
  "prompt-input",
) as HTMLTextAreaElement | null;
const openClaudeButton = document.getElementById(
  "showClaude",
) as HTMLButtonElement | null;
const openGrokButton = document.getElementById(
  "showGrok",
) as HTMLButtonElement | null;
const openDeepSeekButton = document.getElementById(
  "showDeepSeek",
) as HTMLButtonElement | null;

const promptDropdownButton = document.querySelector(
  ".prompt-select",
) as HTMLButtonElement | null;

if (openClaudeButton) {
  openClaudeButton.addEventListener("click", (event: MouseEvent) => {
    if (openClaudeButton.textContent === "Show Claude") {
      openClaudeMessage("open claude now");
      openClaudeButton.textContent = "Hide Claude";
    } else {
      closeClaudeMessage("close claude now");
      openClaudeButton.textContent = "Show Claude";
    }
  });
}

if (openGrokButton) {
  openGrokButton.addEventListener("click", (event: MouseEvent) => {
    if (openGrokButton.textContent === "Show Grok") {
      openGrokMessage("open grok now");
      openGrokButton.textContent = "Hide Grok";
    } else {
      closeGrokMessage("close grok now");
      openGrokButton.textContent = "Show Grok";
    }
  });
}

if (openDeepSeekButton) {
  openDeepSeekButton.addEventListener("click", (event: MouseEvent) => {
    if (openDeepSeekButton.textContent === "Show DeepSeek") {
      openDeepSeekMessage("open deepseek now");
      openDeepSeekButton.textContent = "Hide DeepSeek";
    } else {
      closeDeepSeekMessage("close deepseek now");
      openDeepSeekButton.textContent = "Show DeepSeek";
    }
  });
}

if (textArea) {
  textArea.addEventListener("input", (event: Event) => {
    logToWebPage((event.target as HTMLTextAreaElement).value);
  });

  textArea.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.ctrlKey) {
      if (event.key === "Enter") {
        event.preventDefault();
        ipcRenderer.send("send-prompt");
        console.log("Ctrl + Enter pressed");
        textArea.value = "";
      }
    }
  });
}

if (promptDropdownButton) {
  promptDropdownButton.addEventListener("click", (event: MouseEvent) => {
    console.log("Prompt dropdown button clicked");
    event.stopPropagation();
    ipcRenderer.send('open-form-window');
  });  
}

ipcRenderer.on('inject-prompt', (event, selectedPrompt: string) => {
    console.log('Injecting prompt into textarea:', selectedPrompt);

    const promptInput = document.getElementById('prompt-input') as HTMLTextAreaElement;
    if (promptInput) {
        promptInput.value = selectedPrompt; // Inject the selected prompt into the textarea
    } else {
        console.error('Textarea not found');
    }
});
