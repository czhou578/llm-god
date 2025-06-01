"use strict";
const edit_ipcRenderer = window.electron.ipcRenderer;
let selectedKey = null; // Store the key of the selected row
const edit_form = document.getElementById("form");
const edit_templateContent = document.getElementById("template-content");
const savePromptButton = document.querySelector('button[type="submit"]');
// Disable the save button initially
// savePromptButton.disabled = true;
// Enable the save button when the textarea has content
// edit_templateContent.addEventListener("input", () => {
//   savePromptButton.disabled = templateContent.value.trim() === "";
// });
// Listen for row selection and save the key
edit_ipcRenderer.on("row-selected", (_, key) => {
    selectedKey = key;
    console.log(`Selected key: ${selectedKey}`);
});
// Handle form submission to save the edited prompt
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const editedPrompt = edit_templateContent.value.trim();
    console.log("Saving edited prompt:", editedPrompt);
    console.log("Selected key for saving:", selectedKey);
    if (editedPrompt && selectedKey) {
        edit_ipcRenderer.send("update-prompt", { key: selectedKey, value: editedPrompt });
        console.log(`Updated prompt with key "${selectedKey}" to: "${editedPrompt}"`);
    }
    else {
        console.error("No key selected or prompt is empty.");
    }
});
