import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
    // Note: In a real production app, you would handle this more robustly.
    // Assuming process.env.API_KEY is available as per instructions.
    if (!process.env.API_KEY) {
        console.warn("API_KEY is missing from environment variables.");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateSmartDraft = async (input: string, context: string): Promise<string> => {
    const client = getGeminiClient();
    if (!client) return "Error: API Key missing.";

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Draft a concise, professional, and secure-sounding chat message based on this raw input: "${input}". 
            Context: The user is in a secure encrypted chat application. 
            Do not include quotes or explanations, just the message text.`,
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return input; // Fallback to original input on error
    }
};

export const analyzeSecurity = async (message: string): Promise<string> => {
    const client = getGeminiClient();
    if (!client) return "Error: API Key missing.";

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Explain briefly (max 2 sentences) why End-to-End Encryption (RSA-2048) makes this message secure against interception: "${message}"`,
        });
        return response.text.trim();
    } catch (error) {
        return "Encryption ensures only the holder of the private key can read this.";
    }
}