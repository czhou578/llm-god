const ipcRenderer = window.electron.ipcRenderer;
// Add emoji stripping function (duplicate from utilities since renderer can't import from utilities)
function stripEmojis(text) {
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
export function logToWebPage(message) {
    // Strip emojis before sending
    const cleanMessage = stripEmojis(message);
    const ipcRenderer = window.electron.ipcRenderer;
    ipcRenderer.send("enter-prompt", cleanMessage);
}
export function openClaudeMessage(message) {
    ipcRenderer.send("open-claude", message);
}
export function closeClaudeMessage(message) {
    ipcRenderer.send("close-claude", message);
}
export function openDeepSeekMessage(message) {
    ipcRenderer.send("open-deepseek", message);
}
export function closeDeepSeekMessage(message) {
    ipcRenderer.send("close-deepseek", message);
}
export function openGrokMessage(message) {
    ipcRenderer.send("open-grok", message);
}
export function closeGrokMessage(message) {
    ipcRenderer.send("close-grok", message);
}
const textArea = document.getElementById("prompt-input");
const openClaudeButton = document.getElementById("showClaude");
const openGrokButton = document.getElementById("showGrok");
const openDeepSeekButton = document.getElementById("showDeepSeek");
const promptDropdownButton = document.querySelector(".prompt-select");
if (openClaudeButton) {
    openClaudeButton.addEventListener("click", (event) => {
        if (openClaudeButton.textContent === "Show Claude") {
            openClaudeMessage("open claude now");
            openClaudeButton.textContent = "Hide Claude";
        }
        else {
            closeClaudeMessage("close claude now");
            openClaudeButton.textContent = "Show Claude";
        }
    });
}
if (openGrokButton) {
    openGrokButton.addEventListener("click", (event) => {
        if (openGrokButton.textContent === "Show Grok") {
            openGrokMessage("open grok now");
            openGrokButton.textContent = "Hide Grok";
        }
        else {
            closeGrokMessage("close grok now");
            openGrokButton.textContent = "Show Grok";
        }
    });
}
if (openDeepSeekButton) {
    openDeepSeekButton.addEventListener("click", (event) => {
        if (openDeepSeekButton.textContent === "Show DeepSeek") {
            openDeepSeekMessage("open deepseek now");
            openDeepSeekButton.textContent = "Hide DeepSeek";
        }
        else {
            closeDeepSeekMessage("close deepseek now");
            openDeepSeekButton.textContent = "Show DeepSeek";
        }
    });
}
if (textArea) {
    textArea.addEventListener("input", (event) => {
        logToWebPage(event.target.value);
    });
    textArea.addEventListener("keydown", (event) => {
        if (event.ctrlKey) {
            if (event.key === "Enter") {
                event.preventDefault();
                const promptText = textArea.value;
                if (promptText.trim()) {
                    console.log("Ctrl + Enter pressed, sending prompt:", promptText);
                    ipcRenderer.send("send-prompt", promptText);
                    textArea.value = "";
                }
            }
        }
    });
}
if (promptDropdownButton) {
    promptDropdownButton.addEventListener("click", (event) => {
        console.log("Prompt dropdown button clicked");
        event.stopPropagation();
        ipcRenderer.send("open-form-window");
    });
}
// Update the inject-prompt handler
ipcRenderer.on("inject-prompt", (_, selectedPrompt) => {
    console.log("Injecting prompt into textarea:", selectedPrompt);
    const injectPrompt = () => {
        const promptInput = document.getElementById("prompt-input");
        if (promptInput) {
            // Strip emojis before injecting
            const cleanPrompt = stripEmojis(selectedPrompt);
            console.log("Textarea found, injecting prompt");
            promptInput.value = cleanPrompt;
            promptInput.focus();
            const inputEvent = new Event("input", { bubbles: true });
            promptInput.dispatchEvent(inputEvent);
            console.log("Prompt injected successfully");
        }
        else {
            console.error("Textarea not found, retrying...");
            setTimeout(injectPrompt, 100);
        }
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectPrompt);
    }
    else {
        injectPrompt();
    }
});
