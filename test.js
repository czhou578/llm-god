/**
 * Extract the text response from Google Gemini's web interface output.
 * 
 * @param {string} rawResponse - The raw response from Gemini's web interface
 * @returns {string} The extracted text response
 */
function extractGeminiResponse(rawResponse) {
    try {
      // Extract the inner JSON string from the response
      const match = rawResponse.match(/\["wrb\.fr",null,"(.*?)"\]\]$/);
      if (!match) {
        return "Could not parse the response format";
      }
          
      let innerJsonStr = match[1];
      
      // Unescape the inner JSON string
      innerJsonStr = innerJsonStr.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
      
      // Parse the inner JSON
      const parsedData = JSON.parse(innerJsonStr);
      
      // The response is usually in a nested array structure
      // In the example, it's located at parsedData[3][0][1][0]
      if (Array.isArray(parsedData) && parsedData.length > 3) {
        const responseContainer = parsedData[3];
        
        // Search for the text response in the nested structure
        if (Array.isArray(responseContainer) && responseContainer.length > 0) {
          for (const item of responseContainer) {
            if (Array.isArray(item) && item.length > 1) {
              if (Array.isArray(item[1]) && item[1].length > 0) {
                // Found the most likely location for the response text
                const textParts = item[1][0];
                if (typeof textParts === 'string') {
                  return textParts;
                }
              }
            }
          }
        }
      }
      
      // If the above structure navigation didn't work,
      // let's try a recursive approach to find string content
      function findTextInNestedStructure(data) {
        if (typeof data === 'string' && data.length > 50) { // Assuming the response is reasonably long
          return data;
        }
        if (Array.isArray(data)) {
          for (const item of data) {
            const result = findTextInNestedStructure(item);
            if (result) {
              return result;
            }
          }
        }
        if (data !== null && typeof data === 'object') {
          for (const key in data) {
            const result = findTextInNestedStructure(data[key]);
            if (result) {
              return result;
            }
          }
        }
        return null;
      }
      
      const textResult = findTextInNestedStructure(parsedData);
      if (textResult) {
        return textResult;
      }
        
      // If all else fails, return the entire parsed data for manual inspection
      return `Could not extract response text. Full parsed data: ${JSON.stringify(parsedData)}`;
      
    } catch (error) {
      return `Error extracting response: ${error.message}`;
    }
  }
  
  // Example usage
  function main() {
    // Example raw response from Gemini
    // const rawResponse = `[["wrb.fr",null,"[null,[\"c_dd850dbafb593e2b\",\"r_d238e5b4ee11a36d\"],null,null,[[\"rc_40131ac920e43cba\",[\"As a large language model, I don't experience feelings in the same way humans do.But I 'm functioning well and ready to assist you with your questions and requests!\\n\\nIt\"],[],null,null,null,true,null,[1],\"en\",null,null,[null,null,null,null,null,null,[0],[]],null,null,true,null,null,null,null,null,[false],null,false,[],true,null,null,[]]],[\"Issaquah, WA, USA\",\"SWML_DESCRIPTION_FROM_YOUR_PLACES_HOME\",false,null,\"//www.google.com/maps/vt/data\\u003dxSUpfCN4w0dGwHeftyiKqKqaiAnJzFLbe1xH-aQaAbIZoQDXx_RaP289Ix3fiyL-Z1D9IYP0NzNnXuN_bZ9EI9mLDpxjzP_9bm6oqrMqezVLyJTAjREn1dskm3xkk_p0gWAYgfWgAgOP\"],null,null,\"US\",null,null,null,null,null,false,null,null,null,null,\"en\",null,null,null,true,[]]"]]`;
    const rawResponse = `[["wrb.fr",null,"[null,[\"c_dd850dbafb593e2b\",\"r_a0f8d15a5eea0243\"],null,null,[[\"rc_552d5c3b4d46cc9a\",[\"Alright, here are five jokes for you on this Thursday morning in Issaquah:\\n\\n1.  Why don't eggs tell jokes?They 'd crack each other up!\\n2.  What do you call a lazy kangaroo? Pouch potato!\\n3.  Why did the golfer wear two pairs of pants? In case he got a hole-in-one!\\n4.  What musical instrument is found in the bathroom? A tuba toothpaste!\\n5.  Parallel lines have so much in common... it's a shame they 'll never meet.\\n\\nHope those brought a little smile to your morning! 😊\"],[],null,null,null,true,null,[2],\"en\",null,null,[null,null,null,null,null,null,[0],[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[null,1]],null,null,true,null,null,null,null,null,[false],null,false,[],true,null,null,[]]],[\"Issaquah, WA, USA\",\"SWML_DESCRIPTION_FROM_YOUR_PLACES_HOME\",false,null,\"//www.google.com/maps/vt/data\\u003dxSUpfCN4w0dGwHeftyiKqKqaiAnJzFLbe1xH-aQaAbIZoQDXx_RaP289Ix3fiyL-Z1D9IYP0NzNnXuN_bZ9EI9mLDpxjzP_9bm6oqrMqezVLyJTAjREn1dskm3xkk_p0gWAYgfWgAgOP\"],null,null,\"US\",null,null,null,null,null,true,null,null,null,null,\"en\",null,null,null,true,[]]"]]
`
    const result = extractGeminiResponse(rawResponse);
    console.log(result);
  }
  
  main();
  
  // Node.js module export
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { extractGeminiResponse };
  }