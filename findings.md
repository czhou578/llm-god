````markdown
```typescript
// This approach tried to find React's internal state:
var fiber = inputElement[reactFiberKey];
stateNode.setState({ value: `${escapedPrompt}` });
```
````

React Hooks don't have stateNode.setState. The fiber structure for hooks is a linked list of hook objects on the fiber, not in a state node. Each hook object has a memoizedState property that holds the current state value. You would need to traverse this linked list to find the correct hook and update its memoizedState directly, which is not recommended as it breaks React's state management.

```typescript

} else if (view.id && view.id.match("lmarena")) {
    const escapedPrompt = prompt.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    view.webContents.executeJavaScript(`
        (function() {
            console.log('=== LM Arena Injection Script Started ===');

            var inputElement = document.querySelector('textarea[name="message"]');
            console.log('Step 1 - Found textarea:', !!inputElement);

            if (inputElement) {
                // Step 1: Focus first
                inputElement.focus();
                inputElement.click();
                console.log('Step 1 - Focused and clicked');

                // Step 2: Find React Fiber (the internal React instance)
                var reactFiberKey = Object.keys(inputElement).find(key =>
                    key.startsWith('__reactFiber') ||
                    key.startsWith('__reactInternalInstance')
                );
                console.log('Step 2 - React Fiber key:', reactFiberKey);

                if (reactFiberKey) {
                    var fiber = inputElement[reactFiberKey];
                    console.log('Step 2b - Got fiber:', !!fiber);

                    // Step 3: Navigate up the fiber tree to find the state setter
                    var currentFiber = fiber;
                    var stateNode = null;
                    var maxDepth = 10;
                    var depth = 0;

                    while (currentFiber && depth < maxDepth) {
                        if (currentFiber.stateNode && currentFiber.stateNode.state) {
                            stateNode = currentFiber.stateNode;
                            console.log('Step 3 - Found state node at depth', depth);
                            break;
                        }
                        currentFiber = currentFiber.return;
                        depth++;
                    }

                    // Step 4: If we found the state, update it directly
                    if (stateNode && stateNode.setState) {
                        console.log('Step 4 - Calling setState directly');
                        stateNode.setState({ value: \`${escapedPrompt}\` });
                    }
                }

                // Step 5: Also set the DOM value (for good measure)
                var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype,
                    "value"
                ).set;
                nativeTextAreaValueSetter.call(inputElement, \`${escapedPrompt}\`);
                console.log('Step 5 - Set DOM value:', inputElement.value);

                // Step 6: Dispatch events
                var inputEvent = new Event('input', { bubbles: true, cancelable: true });
                inputElement.dispatchEvent(inputEvent);
                console.log('Step 6 - Dispatched input event');

                // Step 7: Verify
                setTimeout(() => {
                    console.log('Final DOM value:', inputElement.value);
                    console.log('Final visible text:', inputElement.textContent);
                    console.log('=== Script Completed ===');
                }, 100);

            } else {
                console.error('Textarea not found!');
            }
        })();
    `);
}
```

1. Your script sets value ✅
2. Your script dispatches 'input' event ✅
3. React's onChange handler fires ✅
4. React updates its internal state ✅
5. BUT THEN... ❌
6. React IMMEDIATELY re-renders (within milliseconds)
7. React sets the textarea value to whatever is in ITS state
8. Since React's state manager hasn't persisted your change, it renders empty
9. Textarea becomes blank

```typescript
const escapedPrompt = prompt
  .replace(/\\/g, "\\\\")
  .replace(/`/g, "\\`")
  .replace(/\$/g, "\\$")
  .replace(/\n/g, "\\n");
view.webContents.executeJavaScript(`
        (function() {
            var inputElement = document.querySelector('textarea[name="message"]');
            if (inputElement) {
                // Focus the element
                inputElement.focus();
                inputElement.click();
                
                // Set the value using native setter
                var nativeValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype, 
                    "value"
                ).set;
                nativeValueSetter.call(inputElement, \`${escapedPrompt}\`);
                
                // Dispatch input event
                var inputEvent = new Event('input', { bubbles: true });
                inputElement.dispatchEvent(inputEvent);
                
                console.log('Value set:', inputElement.value);
            }
        })();
    `);
```

LM Arena likely uses useEffect or useMemo that watches for certain conditions
Something is resetting the form state (maybe when the component detects it has focus)
The textarea might be controlled by a parent component that has its own state management

nativeValueSetter.call(inputElement, prompt); // ✅ Sets DOM
inputElement.dispatchEvent(inputEvent); // ✅ Triggers React onChange
// React updates LOCAL state ✅
// BUT parent state manager immediately resets it ❌

Perplexity

Final innerHTML: <p dir="auto"><span data-lexical-text="true">s</span></p>

This removes the <span> element that Perplexity's Lexical editor (a React rich text framework) expects, and React immediately recreates it with only the first character because that's what's in its internal state.

```typescript
} else if (view.id && view.id.match("perplexity")) {
    const escapedPrompt = prompt.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\n/g, '\\n');
    view.webContents.executeJavaScript(`
        (function() {
            console.log('=== Perplexity Lexical Injection ===');

            var inputElement = document.querySelector('div[aria-placeholder="Ask anything…"]');
            if (!inputElement) {
                console.error('Input element not found');
                return;
            }

            console.log('Step 1 - Found input element');

            // Focus first
            inputElement.focus();
            inputElement.click();
            console.log('Step 2 - Focused element');

            // Try to find Lexical editor instance
            var reactFiberKey = Object.keys(inputElement).find(key =>
                key.startsWith('__reactFiber') ||
                key.startsWith('__reactInternalInstance')
            );
            console.log('Step 3 - React fiber key:', reactFiberKey);

            var editorFound = false;

            if (reactFiberKey) {
                var fiber = inputElement[reactFiberKey];
                var editor = null;
                var currentFiber = fiber;
                var depth = 0;

                // Search for Lexical editor in fiber tree
                while (currentFiber && depth < 20) {
                    if (currentFiber.stateNode && currentFiber.stateNode._editor) {
                        editor = currentFiber.stateNode._editor;
                        console.log('Step 4a - Found Lexical editor in stateNode at depth', depth);
                        break;
                    }
                    if (currentFiber.memoizedProps && currentFiber.memoizedProps.editor) {
                        editor = currentFiber.memoizedProps.editor;
                        console.log('Step 4b - Found Lexical editor in props at depth', depth);
                        break;
                    }
                    currentFiber = currentFiber.return;
                    depth++;
                }

                if (editor) {
                    console.log('Step 5 - Attempting Lexical update');
                    console.log('Editor object keys:', Object.keys(editor).slice(0, 10));

                    try {
                        // Use Lexical's public API properly
                        editor.update(() => {
                            console.log('Step 5a - Inside update callback');

                            // Get root using public API
                            const root = window.lexicalEditor ? window.lexicalEditor.$getRoot() : null;

                            if (!root) {
                                console.log('Step 5b - Trying alternative root access');
                                // Try to use $getRoot from the editor's context
                                const editorState = editor.getEditorState();
                                console.log('Got editor state:', !!editorState);

                                if (editorState && editorState.read) {
                                    editorState.read(() => {
                                        console.log('Inside editorState.read');
                                        // This won't work for writing, need different approach
                                    });
                                }
                            }

                            console.log('Step 5c - Update callback completed (may have failed)');
                        });

                        editorFound = true;
                        console.log('Step 5d - Lexical update called');
                    } catch (e) {
                        console.error('Step 5 - Error in Lexical update:', e);
                        console.error('Error stack:', e.stack);
                    }
                }
            }

            // Always use fallback approach since Lexical API is not working
            console.log('Step 6 - Using DOM manipulation approach (editor found:', editorFound, ')');

            var pElement = inputElement.querySelector('p');
            var spanElement = pElement ? pElement.querySelector('span[data-lexical-text="true"]') : null;

            console.log('Found <p>:', !!pElement);
            console.log('Found <span>:', !!spanElement);

            if (!pElement) {
                pElement = document.createElement('p');
                pElement.setAttribute('dir', 'auto');
                inputElement.appendChild(pElement);
                console.log('Created new <p>');
            }

            if (!spanElement) {
                spanElement = document.createElement('span');
                spanElement.setAttribute('data-lexical-text', 'true');
                pElement.appendChild(spanElement);
                console.log('Created new <span>');
            }

            var targetText = \`${escapedPrompt}\`;
            var attemptCount = 0;
            var maxAttempts = 100; // Increased attempts
            var successfulSets = 0;
            var requiredSuccessfulSets = 3; // Need 3 consecutive successful sets

            function updateText() {
                var currentText = spanElement.textContent;
                console.log('Attempt', attemptCount, '- Current:', currentText, '| Target:', targetText);

                if (currentText !== targetText) {
                    spanElement.textContent = targetText;
                    successfulSets = 0; // Reset counter

                    // Dispatch events
                    var inputEvent = new InputEvent('input', {
                        bubbles: true,
                        cancelable: true,
                        inputType: 'insertText',
                        data: targetText
                    });
                    inputElement.dispatchEvent(inputEvent);

                    console.log('Set text, dispatched event');
                } else {
                    successfulSets++;
                    console.log('Text matches! Successful sets:', successfulSets);
                }
            }

            updateText();

            // Keep trying until it sticks
            var interval = setInterval(function() {
                attemptCount++;

                if (successfulSets >= requiredSuccessfulSets) {
                    console.log('✅ Text is stable after', successfulSets, 'consecutive checks!');
                    clearInterval(interval);
                    return;
                }

                if (attemptCount >= maxAttempts) {
                    console.error('❌ Failed after', maxAttempts, 'attempts');
                    console.log('Final span content:', spanElement.textContent);
                    clearInterval(interval);
                    return;
                }

                updateText();
            }, 50); // Faster checks - every 50ms

            console.log('Started continuous injection');
        })();
    `);
}
```

Wrapped in IIFE: (function() { ... })(); creates a new scope for each execution

```typescript
mainWindow.webContents.executeJavaScript(`
  {
    let textarea = document.getElementById('prompt-input');
    if (textarea) {
      textarea.value = \`${cleanPrompt.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}\`;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
`);
```
