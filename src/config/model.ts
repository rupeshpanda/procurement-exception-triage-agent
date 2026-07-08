export const MODEL_CONFIG = {
  provider: "anthropic",
  model: process.env.ANTHROPIC_MODEL
};

// Claude Haiku 4.5 list pricing. Override via env if a different model is configured.
export const MODEL_PRICING = {
  inputCostPerMTok: Number(process.env.ANTHROPIC_INPUT_COST_PER_MTOK ?? 1),
  outputCostPerMTok: Number(process.env.ANTHROPIC_OUTPUT_COST_PER_MTOK ?? 5)
};

export function estimateCostUsd(inputTokens: number, outputTokens: number) {
  return (
    (inputTokens / 1_000_000) * MODEL_PRICING.inputCostPerMTok +
    (outputTokens / 1_000_000) * MODEL_PRICING.outputCostPerMTok
  );
}

export function validateModelConfig() {
  if (!process.env.ANTHROPIC_MODEL) {
    throw new Error(
      "ANTHROPIC_MODEL is missing. Set it to the current valid Claude Haiku model ID from the Anthropic console or docs."
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is missing. Claude calls must run server-side with this environment variable configured."
    );
  }
}
