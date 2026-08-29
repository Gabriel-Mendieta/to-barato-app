/**
 * Client-side recipe parser: API may return Markdown or loose text.
 * Does not change the API contract — only adapts for structured UI.
 */

export type RecipeStep = { order: number; text: string };
export type RecipeIngredient = { name: string; quantity?: string };

export type ParsedRecipe = {
  title: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  raw: string;
};

function cleanLine(line: string): string {
  return line
    .replace(/^[-*•]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/^#+\s+/, '')
    .trim();
}

export function parseRecipeMarkdown(raw: string): ParsedRecipe {
  const text = (raw ?? '').trim();
  if (!text) {
    return { title: 'Receta', ingredients: [], steps: [], raw: '' };
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let title = 'Receta';
  const ingredients: RecipeIngredient[] = [];
  const steps: RecipeStep[] = [];
  let section: 'none' | 'ingredients' | 'steps' = 'none';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/^#+\s+/.test(line) && title === 'Receta') {
      title = cleanLine(line);
      continue;
    }
    if (/ingrediente/.test(lower)) {
      section = 'ingredients';
      continue;
    }
    if (/paso|preparaci[oó]n|instrucci/.test(lower)) {
      section = 'steps';
      continue;
    }

    if (section === 'ingredients' && /^([-*\u2022]|\d+[.)])/.test(line)) {
      const cleaned = cleanLine(line);
      const qtyMatch = cleaned.match(/^([\d/.,]+\s*\w*)\s+(.+)$/);
      if (qtyMatch) {
        ingredients.push({ quantity: qtyMatch[1], name: qtyMatch[2] });
      } else {
        ingredients.push({ name: cleaned });
      }
      continue;
    }

    if (section === 'steps' && (/^\d+[.)]/.test(line) || /^[-*]/.test(line))) {
      steps.push({ order: steps.length + 1, text: cleanLine(line) });
      continue;
    }

    if (section === 'none' && title === 'Receta' && line.length < 80) {
      title = cleanLine(line);
    }
  }

  // Fallback: numbered lines as steps if nothing structured found
  if (!steps.length) {
    lines.forEach((line) => {
      if (/^\d+[.)]/.test(line)) {
        steps.push({ order: steps.length + 1, text: cleanLine(line) });
      }
    });
  }

  return { title, ingredients, steps, raw: text };
}
