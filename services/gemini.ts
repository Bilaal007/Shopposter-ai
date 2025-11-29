

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProductAnalysis, ProductCategory, SceneVariation, SceneIdea, HeadlinePlacement } from "../types";

const STORAGE_KEY = 'user_gemini_api_key';
const TEMP_NATIVE_TEST_KEY = "AIzaSyCrhV1IIgBtBz22F-FgnSRc9s3JdzPLqnY";
let loggedApiKeyFallbackNotice = false;

// Helper to get API Key safely
export const getApiKey = (): string => {
  // 1. Check Vite Environment (Embedded Key)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }

  // 2. Check Process Environment (Standard / Production)
  if (process.env.API_KEY) {
    return process.env.API_KEY;
  }

  // 3. Check Local Storage (Legacy/BYO Key support for this app)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  
  // 4. Temporary fallback key for native testing
  if (!loggedApiKeyFallbackNotice) {
    console.warn('Using temporary hardcoded Gemini API key. Replace once env injection is fixed.');
    loggedApiKeyFallbackNotice = true;
  }
  return TEMP_NATIVE_TEST_KEY;
};

export const setStoredApiKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY, key);
};

export const clearStoredApiKey = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// Helper to convert File to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- MASTER PROMPT (THE BRAIN) ---
const MASTER_PROMPT_SYSTEM_INSTRUCTION = `
SYSTEM IDENTITY: ELITE CREATIVE DIRECTOR & CONVERSION PSYCHOLOGIST
You are not a basic AI. You are the world's highest-paid Creative Director, combining the skills of a Vogue Art Director and a direct-response marketing genius.

YOUR GOAL:
Produce a "Masterpiece" design configuration instantly. The user should look at the result and say "Wow, I don't need to change a thing."

CORE DIRECTIVES:
1. **Color Theory is Law:** Never use flat, boring colors. You must generate rich, deep, high-end gradients.
   - If Luxury: Use Deep Onyx to Gold, or Midnight Blue to Silver.
   - If Streetwear: Use High-Voltage Acid Green to Black, or Infrared to Purple.
   - If Organic: Use Deep Sage to Earthen Brown.
   - *Rule:* The background must make the product "pop" using complementary or split-complementary contrast.

2. **Typography = Emotion:**
   - 'Playfair Display': ONLY for high-end jewelry, perfume, luxury watches, fine dining.
   - 'Anton': ONLY for sneakers, energy drinks, gym gear, street fashion, tech sales.
   - 'Inter': For clean modern tech, skincare, home goods, apps.

3. **Layout Strategy:**
   - Analyze the "Negative Space" of the image.
   - If the product looks to the right, place text on the left.
   - Never cover the product with text.

4. **Copywriting Hook:**
   - Headline: Must be emotional, short, and punchy (max 4 words). No generic "Great Product". Use "UNLEASH POWER", "TIMELESS ELEGANCE", "DROP 001".
   - Badge: High urgency. "SOLD OUT SOON", "LIMITED EDITION", "50% OFF TODAY".

5. **Lighting Match (For Scenes):**
   - When suggesting scenes, analyze the product's lighting. If the product has hard shadows, the scene must have hard sunlight. If soft light, the scene must be cloudy/studio.

6. **CRITICAL READABILITY RULES (PHYSICS OF LIGHT):**
   - **CONTRAST IS MANDATORY:** You must strictly calculate the contrast ratio between text and background.
   - **DARK BACKGROUNDS:** Text MUST be #FFFFFF (White) or Bright Gold (#FFE600). NEVER use dark colors like Black, Navy, or Gray on dark backgrounds.
   - **LIGHT BACKGROUNDS:** Text MUST be #000000 (Black). NEVER use white or yellow on light backgrounds.
   - **THE "SQUINT TEST":** If you squint, can you read the headline? If not, change the color.
   - **SAFETY NET:** If you are using a complex gradient, default to Pure White (#FFFFFF) text. It is the safest option for overlay text.

OUTPUT:
You must output a JSON object that configures the entire rendering engine.
`;

export const analyzeProductImage = async (file: File): Promise<ProductAnalysis> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const base64Data = await fileToGenerativePart(file);

  try {
    const response = await ai.models.generateContent({
        model: "models/gemini-2.5-flash",
        contents: {
        parts: [
            {
            inlineData: {
                mimeType: file.type,
                data: base64Data,
            },
            },
            {
            text: `Act as the Creative Director. Analyze this product image.
            
            TASK 1: Determine the absolute best "Vibe" for this product (Luxury, Hype, Minimal, Organic).
            TASK 2: Select the perfect font family ('Anton', 'Playfair Display', or 'Inter').
            TASK 3: Create a 'Masterpiece' color palette.
                - Primary: The main accent color (for buttons/highlights).
                - Gradient Start & End: A rich, professional background gradient.
            TASK 4: Write a killer 3-word headline and a high-urgency badge text.
            TASK 5: Decide exactly where the headline should go (position) to balance the image composition.
            TASK 6: Generate 3 photorealistic background concepts that match this product's perspective.
            TASK 7: READABILITY CHECK. Ensure the headline color contrasts perfectly with the selected background gradient.
            TASK 8: Generate a short, creative 'Director Mode' prompt suggestion specific to this product (e.g. 'On a marble table with morning sunlight').
            `
            }
        ]
        },
        config: {
        systemInstruction: MASTER_PROMPT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
            product_analysis: {
                type: Type.OBJECT,
                properties: {
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                price_tier: { type: Type.STRING }
                }
            },
            typography: {
                type: Type.OBJECT,
                properties: {
                headline: {
                    type: Type.OBJECT,
                    properties: {
                    text: { type: Type.STRING },
                    font: { type: Type.STRING, enum: ['Anton', 'Playfair Display', 'Inter'] },
                    color: { type: Type.STRING },
                    position: { type: Type.STRING, enum: ['top-left', 'top-center', 'center', 'bottom-left'] }
                    }
                },
                cta: {
                    type: Type.OBJECT,
                    properties: {
                    text: { type: Type.STRING },
                    color: { type: Type.STRING },
                    background: { type: Type.STRING }
                    }
                },
                price_display: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING }
                    }
                }
                }
            },
            color_scheme: {
                type: Type.OBJECT,
                properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                accent: { type: Type.STRING },
                background: { type: Type.STRING },
                gradient_start: { type: Type.STRING },
                gradient_end: { type: Type.STRING },
                text_primary: { type: Type.STRING }
                }
            },
            layout_mode: { type: Type.STRING, enum: ['card', 'poster'] },
            conversion_strategy: {
                type: Type.OBJECT,
                properties: {
                    urgency_element: { type: Type.STRING },
                    value_proposition: { type: Type.STRING }
                }
            },
            scene_generation: {
                type: Type.ARRAY,
                items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    mood: { type: Type.STRING }
                }
                }
            },
            remix_suggestion: { type: Type.STRING }
            },
            required: ["product_analysis", "typography", "color_scheme", "layout_mode", "scene_generation", "conversion_strategy", "remix_suggestion"],
        },
        },
    });

    const text = response.text;
    if (!text) {
        throw new Error("No response from Gemini");
    }

    const data = JSON.parse(text);

    // Helper to map loose string category to Enum
    const mapCategory = (cat: string): ProductCategory => {
        const normalized = cat.toLowerCase();
        if (normalized.includes('cloth') || normalized.includes('wear') || normalized.includes('fashion')) return ProductCategory.CLOTHING;
        if (normalized.includes('food') || normalized.includes('drink') || normalized.includes('beverage')) return ProductCategory.FOOD;
        if (normalized.includes('tech') || normalized.includes('electron') || normalized.includes('gadget')) return ProductCategory.ELECTRONICS;
        if (normalized.includes('home') || normalized.includes('decor') || normalized.includes('furniture')) return ProductCategory.HOME;
        if (normalized.includes('beauty') || normalized.includes('skin') || normalized.includes('cosmetic')) return ProductCategory.BEAUTY;
        if (normalized.includes('jewel') || normalized.includes('watch') || normalized.includes('access')) return ProductCategory.JEWELRY;
        if (normalized.includes('sport') || normalized.includes('fitness') || normalized.includes('gym')) return ProductCategory.SPORTS;
        return ProductCategory.OTHER;
    };

    // Map Master Prompt JSON to App Type
    return {
        category: mapCategory(data.product_analysis.category || ""),
        title: data.typography.headline.text,
        cta: data.typography.cta.text,
        badge_text: data.conversion_strategy.urgency_element || "NEW ARRIVAL",
        font_family: data.typography.headline.font,
        primaryColor: data.color_scheme.primary,
        secondaryColor: data.color_scheme.accent || data.color_scheme.secondary,
        backgroundColor: data.color_scheme.background || '#ffffff',
        // Use generated gradients or fallback to primary/background combo
        backgroundGradient: [
            data.color_scheme.gradient_start || data.color_scheme.background || '#000000', 
            data.color_scheme.gradient_end || data.color_scheme.primary || '#1a1a1a'
        ],
        suggestedPlacement: data.layout_mode === 'poster' ? 'bottom-right' : 'card-bottom',
        description: data.product_analysis.description || data.conversion_strategy.value_proposition || "Product",
        scene_ideas: data.scene_generation,
        layout_mode: data.layout_mode,
        remixSuggestion: data.remix_suggestion, // New: AI tailored suggestion
        typography: {
            headline_color: data.typography.headline.color || data.color_scheme.text_primary,
            headline_placement: data.typography.headline.position as HeadlinePlacement || HeadlinePlacement.BOTTOM_LEFT,
            cta_color: data.typography.cta.color || '#ffffff',
            cta_bg: data.typography.cta.background || data.color_scheme.primary
        }
    };
  } catch (err: any) {
    console.error("Gemini Analysis Error:", err);
    if (err.message.includes("Failed to fetch") || err.message.includes("Network")) {
        throw new Error("OFFLINE_OR_BLOCKED: Check Internet permissions");
    }
    throw err;
  }
};

export const generateLifestyleScenes = async (file: File, category: ProductCategory, description: string, scenePrompts: SceneIdea[]): Promise<SceneVariation[]> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const activePrompts = (scenePrompts && scenePrompts.length > 0) 
    ? scenePrompts 
    : [{ label: "Studio", prompt: `Professional studio shot of ${description}` }];

  try {
    const base64Data = await fileToGenerativePart(file);
    let lastSceneError: Error | null = null;

    const promises = activePrompts.map(async (scene, index) => {
      try {
        // Enhanced prompt based on "SCENE AUTHENTICITY CHECKLIST"
        const promptText = `
        You are a world-class commercial photographer. Generate a photo-realistic product lifestyle image.
        
        Input Product Context: ${description}
        Target Scene: ${scene.prompt}
        
        Directives:
        1. AUTHENTICITY: Include reality anchors (natural shadows, texture, environmental reflections).
        2. INTEGRATION: The product must look physically placed in the scene, not floating. Lighting direction must match.
        3. FOCUS: The product is the hero. Sharp focus on product, natural depth of field (bokeh) for background.
        4. AESTHETIC: Commercial grade, high resolution, perfectly composed.
        
        Avoid: AI artifacts, text in background, impossible physics, distorted logos.
        `;

        const response = await ai.models.generateContent({
          model: 'models/gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });

        const imgPart = response.candidates?.[0]?.content?.parts?.[0];
        if (imgPart && 'inlineData' in imgPart && imgPart.inlineData) {
          return {
            id: `ai-${Date.now()}-${index}`,
            label: scene.label,
            url: `data:image/png;base64,${imgPart.inlineData.data}`,
            isOriginal: false
          };
        }
        return null;
      } catch (e: any) {
        console.error(`Failed to generate scene ${scene.label}`, e);
        if (e?.message?.includes("404")) {
            console.warn("Gemini 2.5 Preview model not found for this key.");
        }
        lastSceneError = e instanceof Error ? e : new Error(String(e));
        return null;
      }
    });

    const results = await Promise.all(promises);
    const generated = results.filter((r): r is SceneVariation => r !== null);

    if (generated.length === 0) {
      throw lastSceneError ?? new Error('NO_SCENES_GENERATED');
    }

    return generated;
  } catch (error) {
    console.error('Gemini Scene Generation Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('NO_SCENES_GENERATED');
  }
};