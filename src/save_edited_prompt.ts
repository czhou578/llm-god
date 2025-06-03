const edit_ipcRenderer = (window.electron.ipcRenderer as any)
edit_ipcRenderer.send("edit-prompt-ready"); // Open the edit view when this script is loaded

let selectedKey: string | null = null; // Store the key of the selected row

const edit_form = document.getElementById("form") as HTMLFormElement;
const edit_templateContent = document.getElementById(
  "template-content",
) as HTMLTextAreaElement;
const savePromptButton = document.querySelector(
  'button[type="submit"]',
) as HTMLButtonElement;


// Listen for row selection and save the key
edit_ipcRenderer.on("row-selected", (key: string) => {
    if (!key) {
        console.error("Received empty key in row-selected event.");
        return;
    }
    selectedKey = key;
    console.log(`Selected key received in save_edited_prompt: ${selectedKey}`);
});


// Add event listener to savePromptButton
savePromptButton.addEventListener("click", (e) => {
    e.preventDefault();

  const editedPrompt = edit_templateContent.value.trim();
  console.log(`Edited prompt: "${editedPrompt}"`);
    console.log(`Selected key: ${selectedKey}`);

  if (editedPrompt && selectedKey) {
    edit_ipcRenderer.send("update-prompt", { key: selectedKey, value: editedPrompt });
    console.log(`Sent update-prompt message with key "${selectedKey}" and value "${editedPrompt}"`);
    edit_ipcRenderer.send("close-edit-window"); // <--- Add this line
  
} else {
    console.error("No key selected or prompt is empty.");
  }
});
