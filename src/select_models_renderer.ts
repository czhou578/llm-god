// Load current default models when the window opens
window.addEventListener("DOMContentLoaded", async () => {
  const ipc = window.electron.ipcRenderer;
  const defaultModels = await ipc.invoke("get-default-models");

  if (defaultModels && defaultModels.length > 0) {
    defaultModels.forEach((url: string) => {
      const checkbox = document.querySelector(
        `input[value="${url}"]`
      ) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = true;
      }
    });
  } else {
    // If no models are saved, default to ChatGPT and Gemini
    const chatgptCheckbox = document.getElementById("chatgpt") as HTMLInputElement;
    const geminiCheckbox = document.getElementById("gemini") as HTMLInputElement;
    if (chatgptCheckbox) chatgptCheckbox.checked = true;
    if (geminiCheckbox) geminiCheckbox.checked = true;
  }
});

// Make clicking on the model item also toggle the checkbox
document.querySelectorAll(".model-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    const checkbox = item.querySelector("input[type='checkbox']") as HTMLInputElement;
    if (checkbox && event.target !== checkbox) {
      checkbox.checked = !checkbox.checked;
    }
  });
});

const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");

if (saveButton) {
  saveButton.addEventListener("click", () => {
    const ipc = window.electron.ipcRenderer;
    const checkboxes = document.querySelectorAll(
      'input[type="checkbox"]:checked'
    ) as NodeListOf<HTMLInputElement>;

    const selectedModels = Array.from(checkboxes).map((cb) => cb.value);

    if (selectedModels.length === 0) {
      alert("Please select at least one model.");
      return;
    }

    ipc.send("save-default-models", selectedModels);
  });
}

if (cancelButton) {
  cancelButton.addEventListener("click", () => {
    const ipc = window.electron.ipcRenderer;
    ipc.send("close-model-selection-window");
  });
}
