import { GoogleGenAI } from "@google/genai";
import { GenSettings, ModelType, ChatSettings, ChatMessage } from "../types";

// --- Image Generation ---

export const generateImage = async (
  prompt: string,
  settings: GenSettings,
  referenceImages: string[] = [],
  apiKey: string
): Promise<string[]> => {
  if (!apiKey) throw new Error("API Key is required");
  const ai = new GoogleGenAI({ apiKey });

  try {
    const images: string[] = [];
    
    // Config based on model
    const config: any = {};
    
    if (settings.model === ModelType.PRO) {
        config.imageConfig = {
            aspectRatio: settings.aspectRatio,
            imageSize: settings.imageSize,
        }
    } else {
        config.imageConfig = {
            aspectRatio: settings.aspectRatio,
        }
    }
    
    // Construct the contents with text and optional reference images
    const parts: any[] = [];
    
    // Add reference images
    referenceImages.forEach(imgData => {
        const match = imgData.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
            parts.push({
                inlineData: {
                    mimeType: match[1],
                    data: match[2]
                }
            });
        }
    });

    // Add prompt text
    if (prompt && prompt.trim() !== "") {
        parts.push({ text: prompt });
    } else if (referenceImages.length > 0) {
        parts.push({ text: "Generate a variation of this image." });
    } else {
        throw new Error("PROMPT_REQUIRED");
    }

    // Generate loop
    for (let i = 0; i < settings.numberOfImages; i++) {
        const response = await ai.models.generateContent({
            model: settings.model,
            contents: { parts },
            config: config
        });

        const candidate = response.candidates?.[0];

        // 1. Specific Error Handling for Safety
        if (candidate?.finishReason === 'SAFETY') {
            const ratings = candidate.safetyRatings;
            let details = "";
            if (ratings) {
                const blocked = ratings.filter((r: any) => r.probability === 'HIGH' || r.probability === 'MEDIUM');
                if (blocked.length > 0) {
                    details = blocked.map((r: any) => r.category).join(', ');
                }
            }
            throw new Error(`SAFETY_BLOCK${details ? `: ${details}` : ''}`);
        }
        
        let hasImage = false;
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    images.push(`data:image/png;base64,${part.inlineData.data}`);
                    hasImage = true;
                }
            }
        }
        
        // 2. Check for Text Refusal or Other Failures
        if (!hasImage) {
            const textPart = candidate?.content?.parts?.find((p: any) => p.text);
            if (textPart?.text) {
                console.warn("Model returned text instead of image:", textPart.text);
                if (images.length === 0 && i === settings.numberOfImages - 1) {
                    throw new Error(`MODEL_REFUSAL: ${textPart.text}`);
                }
            } else if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                 if (images.length === 0 && i === settings.numberOfImages - 1) {
                     throw new Error(`GENERATION_FAILED: Finish Reason ${candidate.finishReason}`);
                 }
            }
        }
    }

    if (images.length === 0) {
        throw new Error("NO_IMAGES_GENERATED");
    }

    return images;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

// --- Chat Generation ---

export const streamChatResponse = async (
    history: ChatMessage[],
    newMessage: string,
    attachments: string[],
    settings: ChatSettings,
    systemInstruction: string | undefined,
    apiKey: string,
    onChunk?: (text: string) => void
): Promise<string> => {
    if (!apiKey) throw new Error("API Key is required");
    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare Config
    const config: any = {};

    // Prepare System Instruction (Text + Knowledge Files)
    const systemParts: any[] = [];
    if (systemInstruction) {
        systemParts.push({ text: systemInstruction });
    }
    
    if (settings.knowledgeFiles && settings.knowledgeFiles.length > 0) {
        // Add knowledge files as inlineData to the system instruction
        settings.knowledgeFiles.forEach(file => {
             systemParts.push({
                 inlineData: {
                     mimeType: file.mimeType,
                     data: file.data
                 }
             });
        });
    }

    if (systemParts.length > 0) {
        // Note: SDK allows config.systemInstruction to be a string or Part[]?
        // Checking doc: config.systemInstruction can be string or Content.
        // It's safer to provide it as 'parts' if we have files.
        config.systemInstruction = { parts: systemParts };
    }

    // Tools
    const tools: any[] = [];
    if (settings.useWebSearch) {
        tools.push({ googleSearch: {} });
    }
    if (tools.length > 0) {
        config.tools = tools;
    }

    // Thinking
    if (settings.thinkingBudget > 0) {
        config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
    }

    // Convert history to proper Content format
    const contents = history.map(msg => {
        const parts: any[] = [];
        if (msg.attachments && msg.attachments.length > 0) {
            msg.attachments.forEach(att => {
                const match = att.match(/^data:(.*?);base64,(.*)$/);
                if (match) {
                    parts.push({
                        inlineData: { mimeType: match[1], data: match[2] }
                    });
                }
            });
        }
        if (msg.text) parts.push({ text: msg.text });
        return { role: msg.role, parts };
    });

    // Add new message
    const newParts: any[] = [];
    attachments.forEach(att => {
        const match = att.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
            newParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
    });
    newParts.push({ text: newMessage });
    
    const fullContents = [...contents, { role: 'user', parts: newParts }];

    try {
        const responseStream = await ai.models.generateContentStream({
            model: settings.model,
            contents: fullContents,
            config: config
        });

        let fullText = "";
        for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
                fullText += text;
                if (onChunk) onChunk(text);
            }
        }
        return fullText;

    } catch (error) {
        console.error("Chat Stream Error:", error);
        throw error;
    }
};

export const generateChatTitle = async (firstMessage: string, apiKey: string): Promise<string> => {
    if (!apiKey) return "New Conversation";
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a very short (3-5 words) title for a conversation that starts with: "${firstMessage}". Return ONLY the title, no quotes.`,
        });
        return response.text?.trim() || "New Conversation";
    } catch (e) {
        return "New Conversation";
    }
};