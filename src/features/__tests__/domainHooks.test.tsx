import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAddListItem, useListItems } from '@/src/features/lists/hooks';
import {
  useProductCatalogByType,
  useProductDetail,
  useProductPrices,
  useProductsByProvider,
} from '@/src/features/products/hooks';
import { useProvider } from '@/src/features/providers/hooks';
import { api, endpoints, queryKeys } from '@/src/shared/api';

function createWrapper(client = createQueryClient()) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity, retry: false },
    },
  });
}

describe('hooks de React Query', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deshabilita consultas cuando el ID de lista es inválido', () => {
    const { result } = renderHook(() => useListItems(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
  });

  it('deshabilita consultas de producto y proveedor sin IDs válidos', () => {
    const catalog = renderHook(() => useProductCatalogByType(0), {
      wrapper: createWrapper(),
    });
    const product = renderHook(() => useProductDetail(0), {
      wrapper: createWrapper(),
    });
    const prices = renderHook(() => useProductPrices(undefined), {
      wrapper: createWrapper(),
    });
    const productsByProvider = renderHook(() => useProductsByProvider(0), {
      wrapper: createWrapper(),
    });
    const provider = renderHook(() => useProvider(undefined), {
      wrapper: createWrapper(),
    });

    expect(catalog.result.current.fetchStatus).toBe('idle');
    expect(catalog.result.current.isPending).toBe(true);
    expect(product.result.current.fetchStatus).toBe('idle');
    expect(prices.result.current.fetchStatus).toBe('idle');
    expect(productsByProvider.result.current.fetchStatus).toBe('idle');
    expect(provider.result.current.fetchStatus).toBe('idle');
  });

  it('envía el producto y cantidad correctos e invalida las listas al agregar', async () => {
    const client = createQueryClient();
    const invalidateQueries = jest.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    jest.spyOn(api, 'post').mockResolvedValue({ data: {} } as never);
    const payload = {
      IdLista: 4,
      IdProducto: 12,
      PrecioActual: '0.00' as const,
      Cantidad: 3,
    };

    const { result } = renderHook(() => useAddListItem(), {
      wrapper: createWrapper(client),
    });

    act(() => result.current.mutate(payload));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.post).toHaveBeenCalledWith(endpoints.listaProducto, payload);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.lists.items(payload.IdLista),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.lists.root,
    });
  });
});
