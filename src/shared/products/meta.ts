/** Product display helpers (safe to use online + offline). */

const UNIT_ABBREV: Record<number, string> = {
  1: '/u',
  2: '/lb',
  3: '/L',
  4: '/paq',
};

export function getUnitAbbrev(unidadId: number) {
  return UNIT_ABBREV[unidadId] ?? '';
}

/**
 * Seeded remote placeholder (picsum).
 * Offline API mode still needs network for images; UI should fall back to colored bg + icon.
 */
export function getProductImageUrl(id: number): string {
  return `https://picsum.photos/seed/tobarato-${id}/320/320`;
}
