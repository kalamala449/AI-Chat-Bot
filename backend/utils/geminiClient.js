import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function streamGeminiResponse(userMessage, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const generativeModel = client.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const chat = await generativeModel.startChat({
      systemInstruction: {
        role: "system",
        parts: [{ text: "You are Revolt Chat Live. Only talk about Revolt Motors." }],
      },
    });

    const result = await chat.sendMessageStream(userMessage);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      console.log(text, 31);
      
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
  } catch (error) {
    console.error("Error streaming Gemini response:", error);
    res.status(500).write(`data: ${JSON.stringify({ error: "An error occurred while processing your request." })}\n\n`);
  } finally {
    res.end();
  }
}