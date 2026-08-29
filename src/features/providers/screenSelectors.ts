import { firstRouteParam, type RouteParam } from '@/src/features/products/screenSelectors';
import type { BranchDTO, ProviderDTO } from '@/src/shared/api';

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

export type MapOrigin = {
  latitude: number;
  longitude: number;
};

export type MapBranchCard = BranchDTO & {
  lat: number;
  lng: number;
  distanceKm: number;
  provider?: ProviderDTO;
};

function parseCoordinate(value: unknown, min: number, max: number): number | null {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue >= min && numberValue <= max
    ? numberValue
    : null;
}

function distanceKm(origin: MapOrigin, latitude: number, longitude: number): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(latitude - origin.latitude);
  const dLng = toRad(longitude - origin.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.latitude)) * Math.cos(toRad(latitude)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function selectMapBranches(
  branches: BranchDTO[] | undefined,
  providers: ProviderDTO[] | undefined,
  selectedTipo: number | 'all',
  query: string,
  origin: MapOrigin,
): MapBranchCard[] {
  const providerById = new Map(
    (providers ?? []).map((provider) => [provider.IdProveedor, provider]),
  );
  const normalizedQuery = query.trim().toLowerCase();

  return (branches ?? [])
    .flatMap((branch): MapBranchCard[] => {
      const provider = providerById.get(branch.IdProveedor);
      if (selectedTipo !== 'all' && provider?.IdTipoProveedor !== selectedTipo) return [];

      if (normalizedQuery) {
        const searchable = `${provider?.Nombre ?? ''} ${branch.NombreSucursal}`.toLowerCase();
        if (!searchable.includes(normalizedQuery)) return [];
      }

      const latitude = parseCoordinate(branch.Latitud, -90, 90);
      const longitude = parseCoordinate(branch.Longitud, -180, 180);
      if (latitude == null || longitude == null) return [];

      return [
        {
          ...branch,
          lat: latitude,
          lng: longitude,
          distanceKm: distanceKm(origin, latitude, longitude),
          provider,
        },
      ];
    })
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

export function resolveSelectedBranchId(
  selectedId: number | null,
  branches: MapBranchCard[],
): number | null {
  if (selectedId != null && branches.some((branch) => branch.IdSucursal === selectedId)) {
    return selectedId;
  }
  return branches[0]?.IdSucursal ?? null;
}
