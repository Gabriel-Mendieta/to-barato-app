import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/api';
import type {
  ListCreateRequest,
  ListDTO,
  ListItemDTO,
  ListItemAddRequest,
  ListItemRelationUpdateRequest,
  ListUpdateRequest,
} from '@/src/shared/api/dto';
import {
  addItem,
  all,
  create as createList,
  items,
  removeItem,
  updateItem,
  updateList,
  updateListProvider,
  type ListEntityId,
} from './api';

function isValidId(id: ListEntityId | null | undefined): id is ListEntityId {
  if (id == null || (typeof id === 'string' && !id.trim())) return false;
  const numericId = Number(id);
  return Number.isFinite(numericId) && numericId > 0;
}

export function useLists(userId: ListEntityId | null | undefined) {
  const enabled = isValidId(userId);
  return useQuery({
    queryKey: queryKeys.lists.all(userId ?? null),
    queryFn: () => {
      if (!enabled || userId == null) throw new Error('No hay un usuario válido.');
      return all(userId);
    },
    enabled,
    networkMode: 'always',
  });
}

export function useListItems(listId: ListEntityId | null | undefined) {
  const enabled = isValidId(listId);
  return useQuery({
    queryKey: queryKeys.lists.items(listId ?? 'invalid'),
    queryFn: () => {
      if (!enabled || listId == null) throw new Error('No hay una lista válida.');
      return items(listId);
    },
    enabled,
    networkMode: 'always',
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ListCreateRequest) => {
      if (
        !payload ||
        !isValidId(payload.IdUsuario) ||
        !isValidId(payload.IdProveedor) ||
        typeof payload.Nombre !== 'string' ||
        !payload.Nombre.trim()
      ) {
        throw new Error('Los datos de la lista no son válidos.');
      }
      return createList(payload);
    },
    networkMode: 'always',
    onSuccess: (list, payload) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.lists.all(payload.IdUsuario),
      });
      if (isValidId(list.IdLista)) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.lists.items(list.IdLista),
        });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.providers.root });
    },
  });
}

function invalidateListQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  listId: ListEntityId,
  userId: ListEntityId | null | undefined,
) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.lists.items(listId),
  });
  if (isValidId(userId)) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.lists.all(userId),
    });
  } else {
    void queryClient.invalidateQueries({ queryKey: queryKeys.lists.root });
  }
}

export function useAddListItem(userId?: ListEntityId | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ListItemAddRequest) => addItem(payload),
    networkMode: 'always',
    onSuccess: (_response, payload) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.lists.items(payload.IdLista),
      });
      if (isValidId(userId)) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.lists.all(userId),
        });
      } else {
        void queryClient.invalidateQueries({ queryKey: queryKeys.lists.root });
      }
    },
  });
}

export type UpdateListItemVariables = {
  listId: ListEntityId;
  productId: ListEntityId;
  payload: ListItemRelationUpdateRequest;
};

type ListItemsMutationContext = {
  previousItems?: ListItemDTO[];
};

function validQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}

export function useUpdateListItem(userId?: ListEntityId | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, productId, payload }: UpdateListItemVariables) => {
      if (payload.Cantidad != null && !validQuantity(payload.Cantidad)) {
        throw new Error('La cantidad debe ser un entero mayor que cero.');
      }
      return updateItem(listId, productId, payload);
    },
    networkMode: 'always',
    onMutate: async (variables): Promise<ListItemsMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.lists.items(variables.listId),
      });
      const previousItems = queryClient.getQueryData<ListItemDTO[]>(
        queryKeys.lists.items(variables.listId),
      );
      if (previousItems && variables.payload.Cantidad != null) {
        queryClient.setQueryData<ListItemDTO[]>(
          queryKeys.lists.items(variables.listId),
          previousItems.map((item) =>
            item.IdProducto === Number(variables.productId)
              ? { ...item, Cantidad: variables.payload.Cantidad! }
              : item,
          ),
        );
      }
      return { previousItems };
    },
    onError: (_error, variables, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(queryKeys.lists.items(variables.listId), context.previousItems);
      }
    },
    onSettled: (_response, _error, variables) => {
      invalidateListQueries(queryClient, variables.listId, userId);
      void queryClient.invalidateQueries({ queryKey: ['providers', 'nearby'] });
    },
  });
}

export type RemoveListItemVariables = {
  listId: ListEntityId;
  productId: ListEntityId;
};

export function useRemoveListItem(userId?: ListEntityId | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, productId }: RemoveListItemVariables) => removeItem(listId, productId),
    networkMode: 'always',
    onMutate: async (variables): Promise<ListItemsMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.lists.items(variables.listId),
      });
      const previousItems = queryClient.getQueryData<ListItemDTO[]>(
        queryKeys.lists.items(variables.listId),
      );
      if (previousItems) {
        queryClient.setQueryData<ListItemDTO[]>(
          queryKeys.lists.items(variables.listId),
          previousItems.filter((item) => item.IdProducto !== Number(variables.productId)),
        );
      }
      return { previousItems };
    },
    onError: (_error, variables, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(queryKeys.lists.items(variables.listId), context.previousItems);
      }
    },
    onSettled: (_response, _error, variables) => {
      invalidateListQueries(queryClient, variables.listId, userId);
      void queryClient.invalidateQueries({ queryKey: ['providers', 'nearby'] });
    },
  });
}

export type UpdateListVariables = {
  listId: ListEntityId;
  payload: ListUpdateRequest;
};

export function useUpdateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, payload }: UpdateListVariables) => updateList(listId, payload),
    networkMode: 'always',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists.root });
    },
  });
}

export type UpdateListProviderVariables = {
  listId: ListEntityId;
  providerId: number;
};

type ListProviderMutationContext = {
  previousLists?: ListDTO[];
};

export function useUpdateListProvider(userId?: ListEntityId | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, providerId }: UpdateListProviderVariables) =>
      updateListProvider(listId, providerId),
    networkMode: 'always',
    onMutate: async (variables): Promise<ListProviderMutationContext> => {
      if (isValidId(userId)) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.lists.all(userId),
        });
      }
      const previousLists = isValidId(userId)
        ? queryClient.getQueryData<ListDTO[]>(queryKeys.lists.all(userId))
        : undefined;
      if (previousLists && isValidId(userId)) {
        queryClient.setQueryData<ListDTO[]>(
          queryKeys.lists.all(userId),
          previousLists.map((list) =>
            list.IdLista === Number(variables.listId)
              ? { ...list, IdProveedor: variables.providerId }
              : list,
          ),
        );
      }
      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLists !== undefined && isValidId(userId)) {
        queryClient.setQueryData(queryKeys.lists.all(userId), context.previousLists);
      }
    },
    onSettled: (_response, _error, variables) => {
      invalidateListQueries(queryClient, variables.listId, userId);
      void queryClient.invalidateQueries({ queryKey: ['providers', 'nearby'] });
    },
  });
}

export const useAddItem = useAddListItem;
export const useUpdateItem = useUpdateListItem;
export const useRemoveItem = useRemoveListItem;
