// import { ipcRenderer } from "electron";
const ipcRenderer = window.electron.ipcRenderer;
export function logToWebPage(message) {
  ipcRenderer.send("enter-prompt", message);
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
if (openClaudeButton) {
  openClaudeButton.addEventListener("click", (event) => {
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
  openGrokButton.addEventListener("click", (event) => {
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
  openDeepSeekButton.addEventListener("click", (event) => {
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
  textArea.addEventListener("input", (event) => {
    logToWebPage(event.target.value);
  });
  textArea.addEventListener("keydown", (event) => {
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
