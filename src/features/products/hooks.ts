import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/api';
import type { ListItemDTO } from '@/src/shared/api';
import {
  byProvider,
  catalog,
  catalogByType,
  categories,
  detail,
  prices,
  units,
  type ProductEntityId,
} from './api';

function isValidId(id: ProductEntityId | null | undefined): id is ProductEntityId {
  if (id == null || (typeof id === 'string' && !id.trim())) return false;
  const numericId = Number(id);
  return Number.isFinite(numericId) && numericId > 0;
}

export function useProductCatalog(typeId?: ProductEntityId | null) {
  const enabled = typeId == null || isValidId(typeId);
  return useQuery({
    queryKey: queryKeys.products.catalog(typeId),
    queryFn: () => {
      if (!enabled) throw new Error('No hay un tipo de proveedor válido.');
      return catalog(typeId);
    },
    enabled,
    networkMode: 'always',
  });
}

export function useProductCatalogByType(typeId: ProductEntityId | null | undefined) {
  const enabled = isValidId(typeId);
  return useQuery({
    queryKey: queryKeys.products.catalog(typeId ?? 'invalid'),
    queryFn: () => {
      if (!enabled || typeId == null) throw new Error('No hay un tipo de proveedor válido.');
      return catalogByType(typeId);
    },
    enabled,
    networkMode: 'always',
  });
}

export function useProductDetail(productId: ProductEntityId | null | undefined) {
  const enabled = isValidId(productId);
  return useQuery({
    queryKey: queryKeys.products.detail(productId ?? 'invalid'),
    queryFn: () => {
      if (!enabled || productId == null) throw new Error('No hay un producto válido.');
      return detail(productId);
    },
    enabled,
    networkMode: 'always',
  });
}

export function useProductPrices(productId: ProductEntityId | null | undefined) {
  const enabled = isValidId(productId);
  return useQuery({
    queryKey: queryKeys.products.prices(productId ?? 'invalid'),
    queryFn: () => {
      if (!enabled || productId == null) throw new Error('No hay un producto válido.');
      return prices(productId);
    },
    enabled,
    networkMode: 'always',
  });
}

export type ListProductQueries = {
  details: Record<number, Awaited<ReturnType<typeof detail>> | undefined>;
  prices: Record<number, Awaited<ReturnType<typeof prices>> | undefined>;
  isPending: boolean;
  isError: boolean;
};

/**
 * Composes list relations without calling hooks from a render loop.
 * Keys are products.detail(productId) and products.prices(productId).
 */
export function useListProductQueries(items: ListItemDTO[] | undefined): ListProductQueries {
  const productIds = useMemo(
    () => Array.from(new Set((items ?? []).map((item) => item.IdProducto))),
    [items],
  );
  const detailQueries = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: queryKeys.products.detail(productId),
      queryFn: () => detail(productId),
      networkMode: 'always' as const,
      enabled: isValidId(productId),
    })),
  });
  const priceQueries = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: queryKeys.products.prices(productId),
      queryFn: () => prices(productId),
      networkMode: 'always' as const,
      enabled: isValidId(productId),
    })),
  });

  const details = useMemo(
    () =>
      Object.fromEntries(
        productIds.map((productId, index) => [productId, detailQueries[index]?.data]),
      ) as ListProductQueries['details'],
    [productIds, detailQueries],
  );
  const priceData = useMemo(
    () =>
      Object.fromEntries(
        productIds.map((productId, index) => [productId, priceQueries[index]?.data]),
      ) as ListProductQueries['prices'],
    [productIds, priceQueries],
  );

  return {
    details,
    prices: priceData,
    isPending:
      detailQueries.some((query) => query.isPending) ||
      priceQueries.some((query) => query.isPending),
    isError:
      detailQueries.some((query) => query.isError) || priceQueries.some((query) => query.isError),
  };
}

export function useProductsByProvider(providerId: ProductEntityId | null | undefined) {
  const enabled = isValidId(providerId);
  return useQuery({
    queryKey: queryKeys.products.byProvider(providerId ?? 'invalid'),
    queryFn: () => {
      if (!enabled || providerId == null) throw new Error('No hay un proveedor válido.');
      return byProvider(providerId);
    },
    enabled,
    networkMode: 'always',
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: queryKeys.products.categories(),
    queryFn: categories,
    enabled: true,
    networkMode: 'always',
  });
}

export function useProductUnits() {
  return useQuery({
    queryKey: queryKeys.products.units(),
    queryFn: units,
    enabled: true,
    networkMode: 'always',
  });
}

export const useCatalog = useProductCatalog;
export const useCatalogByType = useProductCatalogByType;
export const useProduct = useProductDetail;
export const useListProducts = useListProductQueries;
