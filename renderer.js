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

const textArea = document.getElementById("prompt-input");
const openClaude = document.getElementById("showClaude");
const openPerplexity = document.getElementById("showPerplexity");
const imagePreview = document.getElementById('imagePreview');

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

const closeButton = document.getElementById("closeButton");

closeButton.addEventListener("click", (event) => {
  const window = remote.getCurrentWindow();
  window.close();
});

// pasteArea.addEventListener('paste', function(e) {
//   e.preventDefault();
//   const items = e.clipboardData.items;

//   for (let i = 0; i < items.length; i++) {
//       if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           const reader = new FileReader();

//           reader.onload = function(event) {
//               const img = document.createElement('img');
//               img.src = event.target.result;
//               imagePreview.innerHTML = '';
//               imagePreview.appendChild(img);

//               // Here you would typically upload the image to your server
//               console.log('Image data:', event.target.result);
//               pasteArea.value = 'Image uploaded successfully!';
//           };

//           reader.readAsDataURL(blob);
//       }
//   }
// });
