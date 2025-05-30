"use strict";
const ipcRenderer1 = window.electron.ipcRenderer;
const form = document.getElementById('form');
const templateContent = document.getElementById('template-content');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Form submitted');
    ipcRenderer1.send('save-prompt', templateContent.value);
});
