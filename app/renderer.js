const { ipcRenderer } = require("electron");

function logToWebPage(message) {
  ipcRenderer.send("enter-prompt", message);
}

const textArea = document.getElementById("prompt-input");
const regex = /^[a-zA-Z0-9.,!?;:'"(){}[\]<>@#$%^&*-+=_/\\|~`\s]$/;

// textArea.addEventListener('keydown', (event) => {
//   const char = event.key;
//   if (event.key === "Enter") {
//     // let prompt = textArea.textContent
//     // console.log(prompt)
//     ipcRenderer.send("send-prompt");
//     // Code to handle Ctrl + Enter key press
//     console.log("Ctrl + Enter pressed");
//   } else {
//     if (regex.test(char)) {
//       logToWebPage(char)
//     }
//   }
// })

textArea.addEventListener("input", (event) => {
  logToWebPage(event.target.value);
});

textArea.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    // let prompt = textArea.textContent
    // console.log(prompt)
    ipcRenderer.send("send-prompt");
    // Code to handle Ctrl + Enter key press
    console.log("Ctrl + Enter pressed");
  }
});
