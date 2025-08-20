import express from "express";

import { streamGeminiResponse } from "../utils/geminiClient.js";

const router = express.Router();


router.post("/", async (req, res) => {
  const { userMessage } = req.body;
  return streamGeminiResponse(userMessage, res);
});

export default router;
