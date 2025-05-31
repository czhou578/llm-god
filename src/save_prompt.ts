const ipcRenderer1 = window.electron.ipcRenderer;

const form = document.getElementById('form') as HTMLFormElement;
const templateContent = document.getElementById('template-content') as HTMLTextAreaElement;
let selectedRow: HTMLTableRowElement | null = null;

form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Form submitted');
    ipcRenderer1.send('save-prompt', templateContent.value);
});

// Fetch stored prompts and populate the table
ipcRenderer1.invoke('get-prompts').then((prompts: Record<string, string>) => {
    const promptTable = document.querySelector('.prompt-table');

    if (!promptTable) {
        console.error('Prompt table not found');
        return;
    }

    // Clear existing rows (if any)
    promptTable.innerHTML = '';

    // Add each prompt as a new row
    for (const [key, value] of Object.entries(prompts)) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.textContent = value; // Display the prompt value
        row.appendChild(cell);

        // Add click event to select the row
        row.addEventListener('click', () => {
            if (selectedRow) {
                selectedRow.classList.remove('selected'); // Deselect previously selected row
            }
            selectedRow = row;
            row.classList.add('selected'); // Highlight the selected row
        });

        promptTable.appendChild(row);
    }
});

const choosePromptButton = document.querySelector('.choose-prompt-button') as HTMLButtonElement;

choosePromptButton.addEventListener('click', () => {
    if (selectedRow) {
        const selectedPrompt = selectedRow.textContent?.trim();
        if (selectedPrompt) {
            ipcRenderer1.send('paste-prompt', selectedPrompt); // Send the selected prompt to the main process
            console.log(`sent prompt: ${selectedPrompt}`);
        }
    } else {
        console.log('No row selected');
    }
});