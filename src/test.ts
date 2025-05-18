/**
 * Extract the text response from Google Gemini's web interface output.
 * @param rawResponse - The raw response from Gemini's web interface
 * @returns The extracted text response
 */
export function extractGeminiResponse(rawResponse: string): string {
  try {
    const match = rawResponse.match(/\\["wrb\\.fr",null,"(.*?)"\\]\\]$/);
    if (!match) {
      return "Could not parse the response format";
    }

    let innerJsonStr = match[1];
    innerJsonStr = innerJsonStr.replace(/\\\\\\\\/g, "\\\\").replace(/\\\\"/g, '"');

    const parsedData = JSON.parse(innerJsonStr);

    if (Array.isArray(parsedData) && parsedData.length > 3) {
      const responseContainer = parsedData[3];
      if (Array.isArray(responseContainer) && responseContainer.length > 0) {
        for (const item of responseContainer) {
          if (Array.isArray(item) && item.length > 1) {
            if (Array.isArray(item[1]) && item[1].length > 0) {
              const textParts = item[1][0];
              if (typeof textParts === "string") {
                return textParts;
              }
            }
          }
        }
      }
    }

    function findTextInNestedStructure(data: any): string | null {
      if (typeof data === "string" && data.length > 50) {
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
      if (data !== null && typeof data === "object") {
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) { // Added hasOwnProperty check
            const result = findTextInNestedStructure(data[key]);
            if (result) {
              return result;
            }
          }
        }
      }
      return null;
    }

    const textResult = findTextInNestedStructure(parsedData);
    if (textResult) {
      return textResult;
    }

    return `Could not extract response text. Full parsed data: ${JSON.stringify(parsedData)}`;
  } catch (error: any) { // Typed error
    return `Error extracting response: ${error.message}`;
  }
}

// Example usage (optional, can be removed or kept for testing this file directly)
/*
function main() {
  const rawResponse = \`[["wrb.fr",null,"[null,[\\"c_dd850dbafb593e2b\\",\\"r_a0f8d15a5eea0243\\"],null,null,[[\\"rc_552d5c3b4d46cc9a\\",[\\"Alright, here are five jokes for you on this Thursday morning in Issaquah:\\\\n\\\\n1.  Why don't eggs tell jokes?They 'd crack each other up!\\\\n2.  What do you call a lazy kangaroo? Pouch potato!\\\\n3.  Why did the golfer wear two pairs of pants? In case he got a hole-in-one!\\\\n4.  What musical instrument is found in the bathroom? A tuba toothpaste!\\\\n5.  Parallel lines have so much in common... it's a shame they 'll never meet.\\\\n\\\\nHope those brought a little smile to your morning! 😊\\"],[],null,null,null,true,null,[2],\\"en\\",null,null,[null,null,null,null,null,null,[0],[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[null,1]],null,null,true,null,null,null,null,null,[false],null,false,[],true,null,null,[]]],[\\"Issaquah, WA, USA\\",\\"SWML_DESCRIPTION_FROM_YOUR_PLACES_HOME\\",false,null,\\"//www.google.com/maps/vt/data\\\\u003dxSUpfCN4w0dGwHeftyiKqKqaiAnJzFLbe1xH-aQaAbIZoQDXx_RaP289Ix3fiyL-Z1D9IYP0NzNnXuN_bZ9EI9mLDpxjzP_9bm6oqrMqezVLyJTAjREn1dskm3xkk_p0gWAYgfWgAgOP\\"],null,null,\\"US\\",null,null,null,null,null,true,null,null,null,null,\\"en\\",null,null,null,true,[]]]]\`;
  const result = extractGeminiResponse(rawResponse);
  console.log(result);
}
main();
*/
