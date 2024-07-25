const { ipcRenderer } = require("electron");

function logToWebPage(message) {
  ipcRenderer.send("enter-prompt", message);
}

const textArea = document.getElementById("prompt-input");

textArea.addEventListener("input", (event) => {
  logToWebPage(event.target.value);
});

textArea.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    ipcRenderer.send("send-prompt");
    console.log("Ctrl + Enter pressed");
  }
});
