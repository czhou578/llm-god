const { ipcRenderer } = require("electron");
const remote = require('@electron/remote')


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
    openClaude.textContent = "Hide Claude"
  } else {
    closeClaudeMessage('close claude now')
    openClaude.textContent = "Show Claude"
  }
})

textArea.addEventListener("input", (event) => {
  logToWebPage(event.target.value);
});

textArea.addEventListener("keydown", (event) => {
  if (event.ctrlKey) {
    if (event.key === "Enter") {
      event.preventDefault()
      ipcRenderer.send("send-prompt");
      console.log("Ctrl + Enter pressed");
      textArea.value = ""
    }
  }
});

const closeButton = document.getElementById('closeButton')

closeButton.addEventListener('click', (event) => {
  const window = remote.getCurrentWindow();
  window.close();
})
