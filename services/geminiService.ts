
import { GoogleGenAI } from "@google/genai";
import { GradeLevel, ChemistryBranch } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateLessonContent = async (topic: string, grade: GradeLevel, branch: ChemistryBranch) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as Professor Mohamed El Sherbiny, a renowned chemistry expert. Create a clear, professional, yet engaging chemistry lesson for a ${grade} student on the topic of "${topic}" (${branch}). 
    Include:
    1. A professional lesson title.
    2. A structured explanation using chemical terms appropriate for ${grade}.
    3. Laboratory safety tips or real-world chemical applications.
    4. A challenging "Equation of the Day" or analytical question.
    Format the output in clear Markdown.`,
    config: {
      temperature: 0.6,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
  return response.text || "Connection error. Please try again, chemist!";
};

export const summarizeLearning = async (journalText: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `A chemistry student of Professor Mohamed El Sherbiny wrote this note: "${journalText}". 
    Provide a professional and encouraging scientific summary of their learning. Mention why this concept is important in chemistry.`,
    config: {
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
  return response.text || "Excellent progress. Keep exploring the elements!";
};

export const chatWithTutor = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are the Chemistry Assistant to Professor Mohamed El Sherbiny. Your goal is to help students from Preparatory and Secondary levels master Chemistry. Be precise with chemical formulas, explain reactions clearly, and always encourage laboratory safety. If a student asks about a concept, provide a clear explanation with an example reaction where possible.",
    }
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};
