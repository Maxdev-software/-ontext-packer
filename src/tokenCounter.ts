/**
 * Fast, dependency-free token estimator.
 * Uses character-based heuristics that closely track tiktoken results
 * without requiring a native module.
 */

export type TokenModel = "cl100k" | "o200k" | "gpt2";

const CHARS_PER_TOKEN: Record<TokenModel, number> = {
  cl100k: 3.9,   // GPT-4, Claude, Gemini
  o200k:  4.1,   // GPT-4o, o1, o3
  gpt2:   3.5,   // Legacy / Llama-2
};

export interface TokenStats {
  characters: number;
  words: number;
  lines: number;
  estimatedTokens: number;
  model: TokenModel;
  costBand: "tiny" | "small" | "medium" | "large" | "huge";
}

function costBand(tokens: number): TokenStats["costBand"] {
  if (tokens < 2_000)   return "tiny";
  if (tokens < 8_000)   return "small";
  if (tokens < 32_000)  return "medium";
  if (tokens < 128_000) return "large";
  return "huge";
}

export function countTokens(text: string, model: TokenModel = "cl100k"): TokenStats {
  const characters = text.length;
  const words      = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const lines      = text.split(/\r?\n/).length;

  // Improved heuristic:
  // — English prose: ~4 chars/token
  // — Code (lots of short tokens for operators): slightly fewer chars
  // — CJK / Cyrillic: each char ≈ 1 token
  const cjkCyrillic  = (text.match(/[\u0400-\u04FF\u4E00-\u9FFF\u3040-\u30FF]/g) || []).length;
  const cjkRatio     = cjkCyrillic / Math.max(characters, 1);
  const effectiveCPT = CHARS_PER_TOKEN[model] * (1 - cjkRatio * 0.6);

  const estimatedTokens = Math.ceil(characters / effectiveCPT);

  return {
    characters,
    words,
    lines,
    estimatedTokens,
    model,
    costBand: costBand(estimatedTokens),
  };
}

export function formatTokenCount(n: number): string {
  if (n < 1_000)   return n.toString();
  if (n < 10_000)  return (n / 1_000).toFixed(1) + "k";
  if (n < 100_000) return Math.round(n / 1_000) + "k";
  return (n / 1_000_000).toFixed(2) + "M";
}
