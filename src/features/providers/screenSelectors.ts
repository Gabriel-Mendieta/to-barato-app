import { firstRouteParam, type RouteParam } from '@/src/features/products/screenSelectors';
import type { ProviderDTO } from '@/src/shared/api';

export type ProviderSelectionProduct = {
  IdProducto: number;
  Nombre: string;
  UrlImagen: string;
  Cantidad: number;
};

export type MutableBooleanRef = { current: boolean };

export function acquireSingleFlight(ref: MutableBooleanRef): boolean {
  if (ref.current) return false;
  ref.current = true;
  return true;
}

function isValidProviderId(id: number | null): id is number {
  return id != null && Number.isInteger(id) && id > 0;
}

function parsePositiveInteger(value: unknown): number | null {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

export function parseIncomingProducts(value: RouteParam): ProviderSelectionProduct[] {
  const rawValue = firstRouteParam(value);
  if (!rawValue?.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeURIComponent(rawValue));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<number>();
  return parsed.flatMap((item): ProviderSelectionProduct[] => {
    if (item == null || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    const productId = parsePositiveInteger(candidate.IdProducto);
    const quantity = parsePositiveInteger(candidate.Cantidad);
    if (productId == null || quantity == null || seen.has(productId)) return [];
    seen.add(productId);

    return [
      {
        IdProducto: productId,
        Nombre:
          typeof candidate.Nombre === 'string' && candidate.Nombre.trim()
            ? candidate.Nombre.trim()
            : `Producto ${productId}`,
        UrlImagen: typeof candidate.UrlImagen === 'string' ? candidate.UrlImagen : '',
        Cantidad: quantity,
      },
    ];
  });
}

export function resolveEffectiveProviderId(
  selectedProviderId: number | null,
  requestedProviderId: number | null,
  providers: ProviderDTO[] | undefined,
): number | null {
  if (isValidProviderId(selectedProviderId)) return selectedProviderId;
  if (isValidProviderId(requestedProviderId)) return requestedProviderId;
  return (
    providers?.find((provider) => isValidProviderId(provider.IdProveedor))?.IdProveedor ?? null
  );
}
