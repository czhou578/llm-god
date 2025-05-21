const { BrowserView } = require("electron");

/**
 * Extracts only the complete text response from a ChatGPT event stream
 * @param {BrowserView} chatGPTView - The browser view containing the ChatGPT response
 * @returns {string} - The complete text response from ChatGPT
 */
function extractChatGPTAnswer(chatGPTView) {
  const currentURL = chatGPTView.webContents.getURL();
  console.log("Current URL:", currentURL);
  if (!currentURL.match("chatgpt.com")) {
    console.log("Not on ChatGPT, skipping script injection");
    return;
  }

  console.log("Injecting script into ChatGPT view");

  // Split the response into individual events
  const scriptToInject = `
    (function() {
      // Your script here
      /**
       * Extracts only the complete text response from a ChatGPT event stream
       * @param {string} streamText - The full text of the stream response
       * @returns {string} - The complete text response from ChatGPT
       */
      function extractChatGPTAnswer(streamText) {
        // Split the response into individual events
        const events = streamText.split('\\n').filter(line => line.trim() !== '');
        
        let fullAnswer = '';
        
        // Process each event line
        for (let i = 0; i < events.length; i++) {
          const line = events[i];
          
          // Skip non-data lines
          if (!line.startsWith('data: ')) continue;
          
          // Extract the JSON data
          try {
            const jsonStr = line.substring(6); // Remove 'data: ' prefix
            if (jsonStr === '[DONE]') continue;
            
            const jsonData = JSON.parse(jsonStr);
            
            // Check for content in different formats
            
            // Format 1: Direct append to content parts
            if (jsonData.p === '/message/content/parts/0' && jsonData.o === 'append' && jsonData.v) {
              fullAnswer += jsonData.v;
              continue;
            }
            
            // Format 2: Simple content value without path
            if (jsonData.v && typeof jsonData.v === 'string') {
              fullAnswer += jsonData.v;
              continue;
            }
            
            // Format 3: Patch operations containing content
            if (jsonData.o === 'patch' && Array.isArray(jsonData.v)) {
              for (const patch of jsonData.v) {
                if (patch.p === '/message/content/parts/0' && patch.o === 'append' && patch.v) {
                  fullAnswer += patch.v;
                }
              }
              continue;
            }
            
            // Format 4: Initial message content
            if (jsonData.v && jsonData.v.message && 
                jsonData.v.message.content && 
                jsonData.v.message.content.parts && 
                jsonData.v.message.content.parts[0]) {
              fullAnswer += jsonData.v.message.content.parts[0];
              continue;
            }
            
          } catch (e) {
            // Silently ignore parsing errors
            continue;
          }
        }
        
        return fullAnswer;
      }

      // Store the original fetch
      const originalFetch = window.fetch;
      
      // Override fetch
      window.fetch = async (...args) => {
        const [resource, config] = args;
        
        if (typeof resource === 'string' && resource.includes('/backend-api/conversation')) {
          const response = await originalFetch(...args);
          
          if (response.status === 200) {
            const clonedResponse = response.clone();
            const reader = clonedResponse.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullText = '';
            
            reader.read().then(function processText({ done, value }) {
              if (done) {
                // Extract just the answer text when the stream is complete
                const answer = extractChatGPTAnswer(fullText);
                console.log("💬 ChatGPT's answer:", answer);
                
                // Send the answer to the main process
                if (window.electron && window.electron.ipcRenderer) {
                  window.electron.ipcRenderer.send('chatgpt-answer', answer);
                } else {
                  // Create a custom event if IPC is not available
                  const event = new CustomEvent('chatgpt-answer', { detail: answer });
                  document.dispatchEvent(event);
                }
                
                return;
              }
              
              const chunk = decoder.decode(value, { stream: true });
              fullText += chunk;
              
              // Continue reading
              return reader.read().then(processText);
            }).catch(err => {
              console.error("❌ Error processing stream:", err);
            });
          }
          
          return response;
        }
        
        return originalFetch(...args);
      };

      console.log("✅ ChatGPT answer extractor is now active");
    })();
  `;

  // Inject the script
  chatGPTView.webContents
    .executeJavaScript(scriptToInject)
    .then((result) => {
      console.log("Script injected successfully");
    })
    .catch((err) => {
      console.error("Error injecting script:", err);
    });

  console.log("✅ ChatGPT answer extractor is now active");
}

module.exports = {
  extractChatGPTAnswer,
};
