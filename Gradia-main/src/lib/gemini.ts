// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Helper to read file as text (for .txt, .md, .json, etc.)
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const generateQuizFromContent = async (content: string) => {
  try {
    // Use the model you requested. Change to "gemini-1.5-flash" if 2.5 is unavailable.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite", 
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
      You are an expert teacher. Analyze the provided text and generate a quiz.
      
      Requirements:
      1. Generate exactly 20 to 25 multiple-choice questions based strictly on the text.
      2. Format the output as a JSON array of objects.
      3. Each object must have:
         - "question": string
         - "options": array of 4 strings
         - "correctAnswer": number (index of the correct option: 0, 1, 2, or 3)
      
      Input Text:
      ${content.substring(0, 30000)} // Truncate to avoid token limits if file is massive
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate quiz");
  }
};