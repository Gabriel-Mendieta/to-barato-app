import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/api';
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
