import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/api';
import type { NearbyBranchesRequest } from '@/src/shared/api/dto';
import { all, branches, byId, nearby, types, type ProviderEntityId } from './api';

function isValidId(id: ProviderEntityId | null | undefined): id is ProviderEntityId {
  if (id == null || (typeof id === 'string' && !id.trim())) return false;
  const numericId = Number(id);
  return Number.isFinite(numericId) && numericId > 0;
}

export function isValidNearbyPayload(
  payload: NearbyBranchesRequest | null | undefined,
): payload is NearbyBranchesRequest {
  return Boolean(
    payload &&
    Number.isFinite(payload.lat) &&
    Number.isFinite(payload.lng) &&
    Array.isArray(payload.ids_productos) &&
    Array.isArray(payload.lista_cantidad) &&
    payload.ids_productos.length > 0 &&
    payload.ids_productos.length === payload.lista_cantidad.length &&
    payload.ids_productos.every((id) => Number.isInteger(id) && id > 0) &&
    payload.lista_cantidad.every((quantity) => Number.isInteger(quantity) && quantity > 0),
  );
}

export function useProviders() {
  return useQuery({
    queryKey: queryKeys.providers.all(),
    queryFn: all,
    enabled: true,
    networkMode: 'always',
  });
}

export function useProvider(providerId: ProviderEntityId | null | undefined) {
  const enabled = isValidId(providerId);
  return useQuery({
    queryKey: queryKeys.providers.byId(providerId ?? 'invalid'),
    queryFn: () => {
      if (!enabled || providerId == null) throw new Error('No hay un proveedor válido.');
      return byId(providerId);
    },
    enabled,
    networkMode: 'always',
  });
}

export function useProviderTypes() {
  return useQuery({
    queryKey: queryKeys.providers.types(),
    queryFn: types,
    enabled: true,
    networkMode: 'always',
  });
}

export function useProviderBranches() {
  return useQuery({
    queryKey: queryKeys.providers.branches(),
    queryFn: branches,
    enabled: true,
    networkMode: 'always',
  });
}

export function useNearbyBranches(payload: NearbyBranchesRequest | null | undefined) {
  const enabled = isValidNearbyPayload(payload);
  return useQuery({
    queryKey: queryKeys.providers.nearby(payload ?? null),
    queryFn: () => {
      if (!enabled || payload == null) throw new Error('La ubicación no es válida.');
      return nearby(payload);
    },
    enabled,
    networkMode: 'always',
  });
}

export const useAllProviders = useProviders;
export const useProviderById = useProvider;
export const useTypes = useProviderTypes;
export const useBranches = useProviderBranches;
export const useNearby = useNearbyBranches;
