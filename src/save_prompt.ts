const ipcRenderer1 = window.electron.ipcRenderer;

const form = document.getElementById("form") as HTMLFormElement;
const templateContent = document.getElementById(
  "template-content",
) as HTMLTextAreaElement;
let selectedRow: HTMLTableRowElement | null = null;

const saveTemplateButton = document.querySelector(
  'button[type="submit"]',
) as HTMLButtonElement;
const choosePromptButton = document.querySelector(
  ".choose-prompt-button",
) as HTMLButtonElement;

// Disable buttons initially
saveTemplateButton.disabled = true;
choosePromptButton.disabled = true;

// Enable or disable the "Save Template" button based on textarea input
templateContent.addEventListener("input", () => {
  saveTemplateButton.disabled = templateContent.value.trim() === "";
});

// Enable or disable the "Choose Prompt" button based on table row selection
const promptTable = document.querySelector(".prompt-table") as HTMLTableElement;

promptTable.addEventListener("click", (event) => {
  const target = event.target as HTMLTableCellElement;
  if (target.tagName === "TD") {
    if (selectedRow) {
      selectedRow.classList.remove("selected"); // Deselect previously selected row
    }
    selectedRow = target.parentElement as HTMLTableRowElement;
    selectedRow.classList.add("selected"); // Highlight the selected row
    choosePromptButton.disabled = false; // Enable the button
  }
});

// Disable "Choose Prompt" button if no row is selected
choosePromptButton.addEventListener("click", () => {
  if (!selectedRow) {
    choosePromptButton.disabled = true;
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("Form submitted");

  const newPrompt = templateContent.value.trim(); // Get the value from the text area
  if (newPrompt) {
    ipcRenderer1.send("save-prompt", newPrompt); // Send the new prompt to the main process

    // Dynamically add the new prompt to the table
    const promptTable = document.querySelector(
      ".prompt-table",
    ) as HTMLTableElement;
    if (promptTable) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.textContent = newPrompt; // Set the cell content to the new prompt
      row.appendChild(cell);

      // Add click event to make the row selectable
      row.addEventListener("click", () => {
        if (selectedRow) {
          selectedRow.classList.remove("selected"); // Deselect previously selected row
        }
        selectedRow = row;
        row.classList.add("selected"); // Highlight the selected row
      });

      promptTable.appendChild(row); // Add the new row to the table
    }

    // Clear the text area after saving
    templateContent.value = "";
  } else {
    console.log("Text area is empty. Nothing to save.");
  }
});

// Fetch stored prompts and populate the table
ipcRenderer1.invoke("get-prompts").then((prompts: Record<string, string>) => {
  const promptTable = document.querySelector(".prompt-table");

  if (!promptTable) {
    console.error("Prompt table not found");
    return;
  }

  // Clear existing rows (if any)
  promptTable.innerHTML = "";

  // Add each prompt as a new row
  for (const [key, value] of Object.entries(prompts)) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.textContent = value; // Display the prompt value
    row.appendChild(cell);

    // Add click event to select the row
    row.addEventListener("click", () => {
      if (selectedRow) {
        selectedRow.classList.remove("selected"); // Deselect previously selected row
      }
      selectedRow = row;
      row.classList.add("selected"); // Highlight the selected row
    });

    promptTable.appendChild(row);
  }
});

choosePromptButton.addEventListener("click", () => {
  if (selectedRow) {
    const selectedPrompt = selectedRow.textContent?.trim();
    if (selectedPrompt) {
      ipcRenderer1.send("paste-prompt", selectedPrompt); // Send the selected prompt to the main process
      console.log(`sent prompt: ${selectedPrompt}`);
      ipcRenderer1.send("close-form-window"); // Send an event to close the form window
      console.log("Form window closed");
    }
  } else {
    console.log("No row selected");
  }
});
