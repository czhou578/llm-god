/**
 * Extracts only the complete text response from a ChatGPT event stream
 * @param chatGPTView - The browser view containing the ChatGPT response
 * @returns The complete text response from ChatGPT, or void if not on the correct page or script injection fails.
 */
export function extractChatGPTAnswer(chatGPTView) {
    // Return type changed to void as it doesn't directly return the answer
    const currentURL = chatGPTView.webContents.getURL();
    console.log("Current URL:", currentURL);
    if (!currentURL.match("chatgpt.com")) {
        console.log("Not on ChatGPT, skipping script injection");
        return;
    }
    console.log("Injecting script into ChatGPT view");
    const scriptToInject = `
    (function() {
      // Your script here
      /**
       * Extracts only the complete text response from a ChatGPT event stream
       * @param {string} streamText - The full text of the stream response
       * @returns {string} - The complete text response from ChatGPT
       */
      function extractChatGPTAnswer(streamText: string): string { // Added type for streamText
        const events = streamText.split('\\n').filter(line => line.trim() !== '');
        let fullAnswer = '';
        for (let i = 0; i < events.length; i++) {
          const line = events[i];
          if (!line.startsWith('data: ')) continue;
          try {
            const jsonStr = line.substring(6);
            if (jsonStr === '[DONE]') continue;
            const jsonData = JSON.parse(jsonStr);
            if (jsonData.p === '/message/content/parts/0' && jsonData.o === 'append' && jsonData.v) {
              fullAnswer += jsonData.v;
              continue;
            }
            if (jsonData.v && typeof jsonData.v === 'string') {
              fullAnswer += jsonData.v;
              continue;
            }
            if (jsonData.o === 'patch' && Array.isArray(jsonData.v)) {
              for (const patch of jsonData.v) {
                if (patch.p === '/message/content/parts/0' && patch.o === 'append' && patch.v) {
                  fullAnswer += patch.v;
                }
              }
              continue;
            }
            if (jsonData.v && jsonData.v.message &&
                jsonData.v.message.content &&
                jsonData.v.message.content.parts &&
                jsonData.v.message.content.parts[0]) {
              fullAnswer += jsonData.v.message.content.parts[0];
              continue;
            }
          } catch (e) {
            continue;
          }
        }
        return fullAnswer;
      }

      const originalFetch = window.fetch;
      window.fetch = async (...args: any[]): Promise<Response> => { // Added types for args and return
        const [resource, config] = args;
        if (typeof resource === 'string' && resource.includes('/backend-api/conversation')) {
          const response = await originalFetch(...args);
          if (response.status === 200) {
            const clonedResponse = response.clone();
            const reader = clonedResponse.body!.getReader(); // Added non-null assertion for body
            const decoder = new TextDecoder("utf-8");
            let fullText = '';
            reader.read().then(function processText({ done, value }): Promise<void> | void { // Added types
              if (done) {
                const answer = extractChatGPTAnswer(fullText);
                console.log("💬 ChatGPT's answer:", answer);
                // @ts-ignore
                if (window.electron && window.electron.ipcRenderer) {
                // @ts-ignore
                  window.electron.ipcRenderer.send('chatgpt-answer', answer);
                } else {
                  const event = new CustomEvent('chatgpt-answer', { detail: answer });
                  document.dispatchEvent(event);
                }
                return;
              }
              const chunk = decoder.decode(value, { stream: true });
              fullText += chunk;
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
    chatGPTView.webContents
        .executeJavaScript(scriptToInject)
        .then((result) => {
        console.log("Script injected successfully");
    })
        .catch((err) => {
        console.error("Error injecting script:", err);
    });
    // This console log might be confusing as it runs before the script is actually confirmed to be active inside the webview.
    // console.log("✅ ChatGPT answer extractor is now active"); // Consider removing or placing in .then()
}
