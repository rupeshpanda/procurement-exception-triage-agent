import { BUSINESS_RULES } from "@/config/businessRules";

export function containsUnsafeWorkflowLanguage(...values: Array<string | undefined>) {
  const text = values.filter(Boolean).join(" ").toLowerCase();
  return BUSINESS_RULES.unsafeWorkflowPhrases.find((phrase) =>
    text.includes(phrase)
  );
}
