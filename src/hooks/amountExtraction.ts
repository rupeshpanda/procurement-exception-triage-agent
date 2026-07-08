export function extractAmountsFromText(text: string) {
  const matches = text.matchAll(
    /(?:\$\s*(\d+(?:,\d{3})*)|(\d{1,3}(?:,\d{3})+))(?:\.\d{2})?/g
  );
  return Array.from(matches)
    .map((match) => Number((match[1] ?? match[2]).replaceAll(",", "")))
    .filter((amount) => Number.isFinite(amount));
}

export function extractAmountsFromObject(value: unknown): number[] {
  const amounts: number[] = [];

  function visit(current: unknown) {
    if (typeof current === "number" && Number.isFinite(current)) {
      amounts.push(current);
      return;
    }

    if (typeof current === "string") {
      amounts.push(...extractAmountsFromText(current));
      return;
    }

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    if (current && typeof current === "object") {
      Object.values(current).forEach(visit);
    }
  }

  visit(value);
  return amounts;
}
