import type { ListDTO } from '@/src/shared/api';

/** Offline stub for “comprados” until the API exposes checked items. */
export function estimateDone(idLista: number, items: number): number {
  if (items <= 0) return 0;
  const seed = (idLista * 7) % 10;
  if (seed < 4) return 0;
  return Math.min(items, Math.max(1, Math.floor((items * seed) / 12)));
}

export function calculateListProgress(idLista: number, items: number) {
  const itemCount = Number.isFinite(items) ? Math.max(0, Math.floor(items)) : 0;
  const done = estimateDone(idLista, itemCount);

  return {
    itemCount,
    done,
    percentage: itemCount ? Math.round((done / itemCount) * 100) : 0,
  };
}

export function calculateListSummary(
  listas: readonly Pick<ListDTO, 'IdLista' | 'PrecioTotal'>[],
  itemCounts: Readonly<Record<number, number>>,
) {
  const budgetTotal = listas.reduce((sum, lista) => sum + (Number(lista.PrecioTotal) || 0), 0);
  const totalItems = listas.reduce((sum, lista) => sum + (itemCounts[lista.IdLista] ?? 0), 0);
  const totalDone = listas.reduce(
    (sum, lista) => sum + calculateListProgress(lista.IdLista, itemCounts[lista.IdLista] ?? 0).done,
    0,
  );

  return {
    budgetTotal,
    totalItems,
    totalDone,
    budgetPct: totalItems ? Math.round((totalDone / totalItems) * 100) : 0,
    // Design stub (~20.8% of sample budget) until real savings exist.
    savings: Math.round(budgetTotal * 0.208 * 100) / 100,
  };
}
