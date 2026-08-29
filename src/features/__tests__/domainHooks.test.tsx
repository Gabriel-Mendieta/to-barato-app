import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  useAddListItem,
  useListItems,
  useRemoveListItem,
  useUpdateListItem,
  useUpdateListProvider,
} from '@/src/features/lists/hooks';
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

    const { result } = renderHook(() => useAddListItem(7), {
      wrapper: createWrapper(client),
    });

    act(() => result.current.mutate(payload));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.post).toHaveBeenCalledWith(endpoints.listaProducto, payload);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.lists.items(payload.IdLista),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.lists.all(7),
    });
  });

  it('actualiza cantidad de forma optimista y revierte el snapshot ante error', async () => {
    const client = createQueryClient();
    const listId = 4;
    const productId = 12;
    const previous = [
      { IdLista: listId, IdProducto: productId, PrecioActual: '5.00', Cantidad: 1 },
    ];
    client.setQueryData(queryKeys.lists.items(listId), previous);
    let rejectRequest!: (error: Error) => void;
    jest.spyOn(api, 'put').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }) as never,
    );

    const { result } = renderHook(() => useUpdateListItem(7), {
      wrapper: createWrapper(client),
    });
    act(() =>
      result.current.mutate({
        listId,
        productId,
        payload: { Cantidad: 4 },
      }),
    );
    await waitFor(() =>
      expect(client.getQueryData(queryKeys.lists.items(listId))).toEqual([
        { ...previous[0], Cantidad: 4 },
      ]),
    );

    act(() => rejectRequest(new Error('fallo')));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(queryKeys.lists.items(listId))).toEqual(previous);
  });

  it('rechaza cantidades inválidas sin llamar al endpoint', async () => {
    const put = jest.spyOn(api, 'put').mockResolvedValue({ data: {} } as never);
    const { result } = renderHook(() => useUpdateListItem(7), {
      wrapper: createWrapper(),
    });

    act(() =>
      result.current.mutate({
        listId: 4,
        productId: 12,
        payload: { Cantidad: 0 },
      }),
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(put).not.toHaveBeenCalled();
  });

  it('elimina optimistamente y revierte el item si falla', async () => {
    const client = createQueryClient();
    const listId = 4;
    const previous = [
      { IdLista: listId, IdProducto: 12, PrecioActual: '5.00', Cantidad: 1 },
      { IdLista: listId, IdProducto: 13, PrecioActual: '7.00', Cantidad: 2 },
    ];
    client.setQueryData(queryKeys.lists.items(listId), previous);
    let rejectRequest!: (error: Error) => void;
    jest.spyOn(api, 'delete').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }) as never,
    );

    const { result } = renderHook(() => useRemoveListItem(7), {
      wrapper: createWrapper(client),
    });
    act(() => result.current.mutate({ listId, productId: 12 }));
    await waitFor(() =>
      expect(client.getQueryData(queryKeys.lists.items(listId))).toEqual([previous[1]]),
    );
    act(() => rejectRequest(new Error('fallo')));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(queryKeys.lists.items(listId))).toEqual(previous);
  });

  it('actualiza proveedor optimistamente y revierte listas ante error', async () => {
    const client = createQueryClient();
    const listId = 4;
    const previous = [
      {
        IdLista: listId,
        IdUsuario: 7,
        IdProveedor: 1,
        Nombre: 'Lista',
        PrecioTotal: '0.00',
        FechaCreacion: '',
      },
    ];
    client.setQueryData(queryKeys.lists.all(7), previous);
    let rejectRequest!: (error: Error) => void;
    jest.spyOn(api, 'put').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }) as never,
    );

    const { result } = renderHook(() => useUpdateListProvider(7), {
      wrapper: createWrapper(client),
    });
    act(() => result.current.mutate({ listId, providerId: 3 }));
    await waitFor(() =>
      expect(client.getQueryData(queryKeys.lists.all(7))).toEqual([
        { ...previous[0], IdProveedor: 3 },
      ]),
    );
    act(() => rejectRequest(new Error('fallo')));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(queryKeys.lists.all(7))).toEqual(previous);
  });

  it('invalida items y listas del usuario después de actualizar cantidad', async () => {
    const client = createQueryClient();
    const invalidateQueries = jest.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    jest.spyOn(api, 'put').mockResolvedValue({ data: {} } as never);
    const { result } = renderHook(() => useUpdateListItem(7), {
      wrapper: createWrapper(client),
    });

    act(() =>
      result.current.mutate({
        listId: 4,
        productId: 12,
        payload: { Cantidad: 2 },
      }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.lists.items(4),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.lists.all(7),
    });
  });

  it('invalida items y listas del usuario después de borrar y cambiar proveedor', async () => {
    const client = createQueryClient();
    const invalidateQueries = jest.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    jest.spyOn(api, 'delete').mockResolvedValue({ data: {} } as never);
    jest.spyOn(api, 'put').mockResolvedValue({ data: {} } as never);

    const remove = renderHook(() => useRemoveListItem(7), {
      wrapper: createWrapper(client),
    });
    act(() => remove.result.current.mutate({ listId: 4, productId: 12 }));
    await waitFor(() => expect(remove.result.current.isSuccess).toBe(true));

    const provider = renderHook(() => useUpdateListProvider(7), {
      wrapper: createWrapper(client),
    });
    act(() => provider.result.current.mutate({ listId: 4, providerId: 3 }));
    await waitFor(() => expect(provider.result.current.isSuccess).toBe(true));

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.lists.items(4),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.lists.all(7),
    });
  });
});
