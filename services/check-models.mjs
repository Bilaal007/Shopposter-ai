import { GoogleGenAI } from "@google/genai";

// 1. PASTE YOUR KEY INSIDE THE QUOTES BELOW
const apiKey = "AIzaSyAbXDFbkfjwM5d8t5mGHHgz06s9zhEL3OY";

console.log("--- Connecting to Google with Key: " + apiKey.substring(0, 10) + "... ---");

const ai = new GoogleGenAI({ apiKey });

async function checkModels() {
  try {
    console.log("Asking Google for available models...");
    
    // Call the API to get the list
    const response = await ai.models.list();
    
    // The SDK returns a complex object, we just want the names
    // Depending on the exact SDK version, the structure varies, so we log everything clearly.
    console.log("\n--- SUCCESS! HERE IS YOUR LIST ---");
    
    // Loop through and print nice clean names
    if (Array.isArray(response)) {
        response.forEach(model => {
            // We only care about models that support 'generateContent'
            if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`✅ ${model.name}`);
            }
        });
    } else if (response.models) {
         response.models.forEach(model => {
            if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`✅ ${model.name}`);
            }
        });
    } else {
        console.log("Raw Response:", response);
    }
    
  } catch (error) {
    console.error("\n❌ ERROR: Could not list models.");
    console.error(error.message);
  }
}

checkModels();