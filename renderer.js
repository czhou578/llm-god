const { ipcRenderer } = require("electron");
const remote = require("@electron/remote");

function logToWebPage(message) {
  ipcRenderer.send("enter-prompt", message);
}

function openClaudeMessage(message) {
  ipcRenderer.send("open-claude", message);
}

function closeClaudeMessage(message) {
  ipcRenderer.send("close-claude", message);
}

function openPerplexityMessage(message) {
  ipcRenderer.send("open-perplexity", message);
}

function closePerplexityMessage(message) {
  ipcRenderer.send("close-perplexity", message);
}

function openDeepSeekMessage(message) {
  ipcRenderer.send("open-deepseek", message);
}

function closeDeepSeekMessage(message) {
  ipcRenderer.send("close-deepseek", message);
}

function openGrokMessage(message) {
  ipcRenderer.send("open-grok", message);
}

function closeGrokMessage(message) {
  ipcRenderer.send("close-grok", message);
}

const textArea = document.getElementById("prompt-input");
const openClaude = document.getElementById("showClaude");
const openPerplexity = document.getElementById("showPerplexity");
const openGrok = document.getElementById("showGrok");
const openDeepSeek = document.getElementById("showDeepSeek");

openPerplexity.addEventListener("click", (event) => {
  if (openPerplexity.textContent === "Show Perplexity") {
    openPerplexityMessage("open perplexity now");
    openPerplexity.textContent = "Hide Perplexity";
  } else {
    closePerplexityMessage("close perplexity now");
    openPerplexity.textContent = "Show Perplexity";
  }
});

openClaude.addEventListener("click", (event) => {
  if (openClaude.textContent === "Show Claude") {
    openClaudeMessage("open claude now");
    openClaude.textContent = "Hide Claude";
  } else {
    closeClaudeMessage("close claude now");
    openClaude.textContent = "Show Claude";
  }
});

openGrok.addEventListener("click", (event) => {
  if (openGrok.textContent === "Show Grok") {
    openGrokMessage("open grok now");
    openGrok.textContent = "Hide Grok";
  } else {
    closeGrokMessage("close grok now");
    openGrok.textContent = "Show Grok";
  }
});

openDeepSeek.addEventListener("click", (event) => {
  if (openDeepSeek.textContent === "Show DeepSeek") {
    openDeepSeekMessage("open deepseek now");
    openDeepSeek.textContent = "Hide DeepSeek";
  } else {
    closeDeepSeekMessage("close deepseek now");
    openDeepSeek.textContent = "Show DeepSeek";
  }
});

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
