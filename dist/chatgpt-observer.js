"use strict";
(() => {
    console.log("ChatGPT Observer: Script injected.");
    // --- Configuration ---
    // Selector for the button that is ONLY visible while ChatGPT is generating a response.
    const stopGeneratingButtonSelector = 'button[aria-label="Stop generating"]';
    // Selector for the button you want to programmatically click AFTER the response is complete.
    // EXAMPLE: This selector targets the "Copy" button on the last message. You may need to adjust it.
    const targetButtonToClickSelector = 'div.text-base:last-of-type button[aria-label="Copy"]';
    let debounceTimer; // Timer for debouncing the click action
    let isGenerating = false;
    const onGenerationFinish = () => {
        console.log("ChatGPT Observer: Generation finished.");
        isGenerating = false;
        // Find the last message's button cluster
        const allMessageGroups = document.querySelectorAll('div.text-base');
        const lastMessageGroup = allMessageGroups[allMessageGroups.length - 1];
        if (lastMessageGroup) {
            // Find the specific button within the last message group
            const targetButton = lastMessageGroup.querySelector(targetButtonToClickSelector.replace('div.text-base:last-of-type ', '')); // Adjust selector for context
            if (targetButton) {
                console.log("ChatGPT Observer: Found target button. Clicking now.", targetButton);
                targetButton.click();
            }
            else {
                console.error("ChatGPT Observer: Target button not found with selector:", targetButtonToClickSelector);
            }
        }
    };
    const observer = new MutationObserver((mutations) => {
        // Check if the "Stop generating" button has appeared or disappeared.
        const stopButton = document.querySelector(stopGeneratingButtonSelector);
        if (stopButton && !isGenerating) {
            // Generation has started.
            isGenerating = true;
            console.log("ChatGPT Observer: Generation started.");
        }
        // If we were generating but the stop button has now disappeared, generation is finished.
        if (!stopButton && isGenerating) {
            // Use a small debounce to ensure all final UI elements have rendered.
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(onGenerationFinish, 500); // Wait 500ms to be safe
        }
    });
    // Start observing the entire document body for changes.
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
