"use strict";
const ipcRenderer1 = window.electron.ipcRenderer;
const form = document.getElementById("form");
const templateContent = document.getElementById("template-content");
let selectedRow = null;
const saveTemplateButton = document.querySelector('button[type="submit"]');
const choosePromptButton = document.querySelector(".choose-prompt-button");
// Disable buttons initially
saveTemplateButton.disabled = true;
choosePromptButton.disabled = true;
// Enable or disable the "Save Template" button based on textarea input
templateContent.addEventListener("input", () => {
    saveTemplateButton.disabled = templateContent.value.trim() === "";
});
// Enable or disable the "Choose Prompt" button based on table row selection
const promptTable = document.querySelector(".prompt-table");
promptTable.addEventListener("click", (event) => {
    const target = event.target;
    if (target.tagName === "TD") {
        if (selectedRow) {
            selectedRow.classList.remove("selected"); // Deselect previously selected row
        }
        selectedRow = target.parentElement;
        selectedRow.classList.add("selected"); // Highlight the selected row
        choosePromptButton.disabled = false; // Enable the button
    }
    //   if (target.classList.contains("edit-button")) {
    //     const row = target.closest("tr") as HTMLTableRowElement;
    //     const promptText = row.querySelector("td")?.textContent?.trim();
    //     if (promptText) {
    //       console.log(`Editing prompt: ${promptText}`);
    //       // Add your edit logic here (e.g., populate the textarea with the prompt)
    //       const templateContent = document.getElementById(
    //         "template-content",
    //       ) as HTMLTextAreaElement;
    //       templateContent.value = promptText;
    //     }
    //   }
    if (target.classList.contains("delete-button")) {
        const row = target.closest("tr");
        let promptText = row.querySelector("td")?.textContent?.trim();
        if (promptText) {
            // Normalize the string to remove variation selectors and ensure consistency
            promptText = promptText.normalize("NFKC");
            // Remove emojis and other non-printable characters
            promptText = promptText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u200D\uFE0F]/gu, "");
            // Remove any remaining non-printable characters
            promptText = promptText.replace(/[^\P{C}\n\t\r ]+/gu, "");
            console.log(`Deleting prompt: ${promptText}`);
            ipcRenderer1.send("delete-prompt-by-value", promptText); // Send the value to the main process
            row.remove();
        }
    }
});
// Listen for confirmation from the main process
ipcRenderer1.on("prompt-deleted", (_, { key, value }) => {
    console.log(`Prompt with key "${key}" and value "${value}" was deleted from the store.`);
});
ipcRenderer1.on("prompt-not-found", (_, value) => {
    console.error(`No matching entry found for value: "${value}"`);
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
        const promptTable = document.querySelector(".prompt-table");
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
    }
    else {
        console.log("Text area is empty. Nothing to save.");
    }
});
// Fetch stored prompts and populate the table
ipcRenderer1.invoke("get-prompts").then((prompts) => {
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
        const row_action_div = document.createElement("div");
        row_action_div.className = "row-actions";
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "🗑️";
        deleteButton.className = "delete-button";
        deleteButton.title = "Delete";
        const editButton = document.createElement("button");
        editButton.textContent = "✏️";
        editButton.className = "edit-button";
        editButton.title = "Edit";
        row_action_div.appendChild(deleteButton);
        row_action_div.appendChild(editButton);
        cell.textContent = value; // Display the prompt value
        row.appendChild(cell);
        cell.appendChild(row_action_div);
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
    }
    else {
        console.log("No row selected");
    }
});
