const { ipcRenderer } = require("electron");

function logToWebPage(message) {
  ipcRenderer.send("enter-prompt", message);
}

function openClaudeMessage(message) {
  ipcRenderer.send("open-claude", message);
}

function closeClaudeMessage(message) {
  ipcRenderer.send("close-claude", message);
}

const textArea = document.getElementById("prompt-input");
const openClaude = document.getElementById("showClaude")

openClaude.addEventListener('click', (event) => {
  if (openClaude.textContent === "Show Claude") {
    openClaudeMessage('open claude now')
  } else {
    closeClaudeMessage('close claude now')
  }
})

textArea.addEventListener("input", (event) => {
  logToWebPage(event.target.value);
});

textArea.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    ipcRenderer.send("send-prompt");
    console.log("Ctrl + Enter pressed");
  }
});
