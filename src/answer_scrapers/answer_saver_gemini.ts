// import { BrowserView } from "electron"; // Assuming BrowserView might be needed if uncommented

// /**
//  * Extracts only the complete text response from a ChatGPT event stream
//  * @param {BrowserView} geminiView - The browser view containing the ChatGPT response
//  * @returns {string} - The complete text response from ChatGPT
//  */

// function extractGeminiAnswer(geminiView: BrowserView) { // Added type for geminiView
//     const currentURL = geminiView.webContents.getURL();
//     console.log('Current URL:', currentURL);
//     if (!currentURL.match('gemini.google.com')) {
//       console.log('Not on Gemini, skipping script injection');
//       return;
//     }

//     console.log('Injecting script into Gemini view');

//     const scriptToInject = `
//     (function() {
//       // Your script here
//       /**
//        * Extracts only the complete text response from a Gemini event stream
//        * @param {string} streamText - The full text of the stream response
//        * @returns {string} - The complete text response from Gemini
//        */
//       function extractGeminiAnswer(streamText: string): string { // Added type for streamText
//         const events = streamText.split('\\n').filter(line => line.trim() !== '');
//         let fullAnswer = '';
//         for (let i = 0; i < events.length; i++) {
//           const line = events[i];
//           if (!line.startsWith('data: ')) continue;
//           try {
//             const jsonStr = line.substring(6);
//             if (jsonStr === '[DONE]') continue;
//             const jsonData = JSON.parse(jsonStr);
//             if (jsonData.p === '/message/content/parts/0' && jsonData.o === 'append' && jsonData.v) {
//               fullAnswer += jsonData.v;
//               continue;
//             }
//             if (jsonData.v && typeof jsonData.v === 'string') {
//               fullAnswer += jsonData.v;
//               continue;
//             }
//           } catch (e) {
//             console.error('Error parsing JSON:', e);
//           }
//         }
//         return fullAnswer;
//       }

//       const originalFetch = window.fetch;
//       window.fetch = async (...args: any[]): Promise<Response> => { // Added types
//         const [resource, config] = args;
//         if (typeof resource === 'string' && resource.includes('assistant.lamda.BardFrontendService/StreamGenerate')) {
//           const response = await originalFetch(...args);
//           if (response.status === 200) {
//             const clonedResponse = response.clone();
//             const reader = clonedResponse.body!.getReader(); // Added non-null assertion
//             const decoder = new TextDecoder("utf-8");
//             let fullText = '';
//             reader.read().then(function processText({ done, value }): Promise<void> | void { // Added types
//               if (done) {
//                 const answer = extractGeminiAnswer(fullText); // Changed from extractChatGPTAnswer
//                 console.log("💬 Gemini's answer:", answer); // Changed log message
//                 // @ts-ignore
//                 if (window.electron && window.electron.ipcRenderer) {
//                 // @ts-ignore
//                   window.electron.ipcRenderer.send('gemini-answer', answer); // Changed event name
//                 } else {
//                   const event = new CustomEvent('gemini-answer', { detail: answer }); // Changed event name
//                   document.dispatchEvent(event);
//                 }
//                 return;
//               }
//               const chunk = decoder.decode(value, { stream: true });
//               fullText += chunk;
//               return reader.read().then(processText);
//             }).catch(err => {
//               console.error("❌ Error processing stream:", err);
//             });
//           }
//           return response;
//         }
//         return originalFetch(...args);
//       };
//       console.log("✅ Gemini answer extractor is now active");
//     })();
//   `;
//   // Script injection logic would go here if the function were active
//   // geminiView.webContents.executeJavaScript(scriptToInject).then(...).catch(...);
// }
