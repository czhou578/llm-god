// const { BrowserView } = require("electron");

// /**
//  * Extracts only the complete text response from a ChatGPT event stream
//  * @param {BrowserView} geminiView - The browser view containing the ChatGPT response
//  * @returns {string} - The complete text response from ChatGPT
//  */

// function extractGeminiAnswer(geminiView) {
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
//       function extractGeminiAnswer(streamText) {
//         // Split the response into individual events
//         const events = streamText.split('\\n').filter(line => line.trim() !== '');
        
//         let fullAnswer = '';
        
//         // Process each event line
//         for (let i = 0; i < events.length; i++) {
//           const line = events[i];
          
//           // Skip non-data lines
//           if (!line.startsWith('data: ')) continue;
          
//           // Extract the JSON data
//           try {
//             const jsonStr = line.substring(6); // Remove 'data: ' prefix
//             if (jsonStr === '[DONE]') continue;
            
//             const jsonData = JSON.parse(jsonStr);
            
//             // Check for content in different formats
            
//             // Format 1: Direct append to content parts
//             if (jsonData.p === '/message/content/parts/0' && jsonData.o === 'append' && jsonData.v) {
//               fullAnswer += jsonData.v;
//               continue;
//             }
            
//             // Format 2: Simple content value without path
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
      
//       // Override fetch
//       window.fetch = async (...args) => {
//         const [resource, config] = args;
        
//         if (typeof resource === 'string' && resource.includes('assistant.lamda.BardFrontendService/StreamGenerate')) {
//           const response = await originalFetch(...args);
          
//           if (response.status === 200) {
//             const clonedResponse = response.clone();
//             const reader = clonedResponse.body.getReader();
//             const decoder = new TextDecoder("utf-8");
//             let fullText = '';
            
//             reader.read().then(function processText({ done, value }) {
//               if (done) {
//                 // Extract just the answer text when the stream is complete
//                 const answer = extractChatGPTAnswer(fullText);
//                 console.log("💬 ChatGPT's answer:", answer);
                
//                 // Send the answer to the main process
//                 if (window.electron && window.electron.ipcRenderer) {
//                   window.electron.ipcRenderer.send('chatgpt-answer', answer);
//                 } else {
//                   // Create a custom event if IPC is not available
//                   const event = new CustomEvent('chatgpt-answer', { detail: answer });
//                   document.dispatchEvent(event);
//                 }
                
//                 return;
//               }
              
//               const chunk = decoder.decode(value, { stream: true });
//               fullText += chunk;
              
//               // Continue reading
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

// }

