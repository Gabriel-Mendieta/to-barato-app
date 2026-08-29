import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { useListItems } from '@/src/features/lists/hooks';
import {
  useProductDetail,
  useProductPrices,
  useProductsByProvider,
} from '@/src/features/products/hooks';
import { useProvider } from '@/src/features/providers/hooks';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('hooks de React Query', () => {
  it('deshabilita consultas cuando el ID de lista es inválido', () => {
    const { result } = renderHook(() => useListItems(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
  });

  it('deshabilita consultas de producto y proveedor sin IDs válidos', () => {
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

    expect(product.result.current.fetchStatus).toBe('idle');
    expect(prices.result.current.fetchStatus).toBe('idle');
    expect(productsByProvider.result.current.fetchStatus).toBe('idle');
    expect(provider.result.current.fetchStatus).toBe('idle');
  });
});
