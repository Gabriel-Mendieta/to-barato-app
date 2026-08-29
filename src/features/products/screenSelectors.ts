export type RouteParam = string | string[] | undefined;

export function firstRouteParam(value: RouteParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseProductId(value: RouteParam): number | null {
  const rawValue = firstRouteParam(value);
  if (!rawValue?.trim()) return null;
  const id = Number(rawValue);
  return Number.isInteger(id) && id > 0 ? id : null;
}
