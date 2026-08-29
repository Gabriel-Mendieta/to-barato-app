import { QueryClient } from '@tanstack/react-query';
import type { NearbyBranchesRequest } from './dto';
import { ApiError } from './errors';

export type QueryEntityId = string | number;

const queryId = (id: QueryEntityId | null | undefined) => (id == null ? null : String(id));

export const listKeys = {
  root: ['lists'] as const,
  all: (userId: QueryEntityId | null) => ['lists', 'all', queryId(userId)] as const,
  items: (listId: QueryEntityId) => ['lists', 'items', String(listId)] as const,
};

export const productKeys = {
  root: ['products'] as const,
  catalog: (typeId?: QueryEntityId | null) =>
    ['products', 'catalog', typeId == null ? 'all' : String(typeId)] as const,
  detail: (productId: QueryEntityId) => ['products', 'detail', String(productId)] as const,
  prices: (productId: QueryEntityId) => ['products', 'prices', String(productId)] as const,
  byProvider: (providerId: QueryEntityId) =>
    ['products', 'by-provider', String(providerId)] as const,
  categories: () => ['products', 'categories'] as const,
  units: () => ['products', 'units'] as const,
};

function serializableNearbyPayload(payload: NearbyBranchesRequest | null) {
  if (!payload) return null;
  return {
    ...payload,
    ids_productos: [...payload.ids_productos],
    lista_cantidad: [...payload.lista_cantidad],
  };
}

export const providerKeys = {
  root: ['providers'] as const,
  all: () => ['providers', 'all'] as const,
  byId: (providerId: QueryEntityId) => ['providers', 'detail', String(providerId)] as const,
  types: () => ['providers', 'types'] as const,
  branches: () => ['providers', 'branches'] as const,
  nearby: (payload: NearbyBranchesRequest | null) =>
    ['providers', 'nearby', serializableNearbyPayload(payload)] as const,
};

export const queryKeys = {
  user: (id: QueryEntityId) => ['user', String(id)] as const,
  lists: listKeys,
  products: productKeys,
  providers: providerKeys,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      networkMode: 'always',
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status != null && error.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      networkMode: 'always',
      retry: 0,
    },
  },
});
