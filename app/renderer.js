const {
  contextBridge,
  ipcRenderer
} = require("electron");


function logToWebPage(message) {
  ipcRenderer.send('enter-prompt', message);
}

const textArea = document.getElementById('prompt-input')

textArea.addEventListener('input', (event) => {
  logToWebPage(event.target.value);
});

textArea.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    // let prompt = textArea.textContent
    // console.log(prompt)
    ipcRenderer.send('send-prompt')
    // Code to handle Ctrl + Enter key press
    console.log('Ctrl + Enter pressed');
  }
});