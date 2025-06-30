import Exa from "exa-js";

import { createOpenAI } from "@ai-sdk/openai";
import OpenAI from "openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GoogleGenAI } from "@google/genai";

import { createPerplexity } from "@ai-sdk/perplexity";

export const perplexityProvider = createPerplexity({
  apiKey: process.env.PERPLEXITY_AI_API_KEY ?? "",
});

export const googleGenAIProvider = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_AI_KEY,
});

export const exaProvider = new Exa(process.env.EXA_AI_API_KEY);

export const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GEMINI_AI_KEY,
});

export const openaiProvider = createOpenAI({
  apiKey: process.env.AI_API_KEY,
  compatibility: "strict",
});

export const openaiClient = new OpenAI({
  apiKey: process.env.AI_API_KEY,
});
