import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/api';
import type {
  ListItemAddRequest,
  ListItemRelationUpdateRequest,
  ListUpdateRequest,
} from '@/src/shared/api/dto';
import {
  addItem,
  all,
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

export function useAddListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ListItemAddRequest) => addItem(payload),
    networkMode: 'always',
    onSuccess: (_response, payload) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.lists.items(payload.IdLista),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists.root });
    },
  });
}

export type UpdateListItemVariables = {
  listId: ListEntityId;
  productId: ListEntityId;
  payload: ListItemRelationUpdateRequest;
};

export function useUpdateListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, productId, payload }: UpdateListItemVariables) =>
      updateItem(listId, productId, payload),
    networkMode: 'always',
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.lists.items(variables.listId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists.root });
    },
  });
}

export type RemoveListItemVariables = {
  listId: ListEntityId;
  productId: ListEntityId;
};

export function useRemoveListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, productId }: RemoveListItemVariables) => removeItem(listId, productId),
    networkMode: 'always',
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.lists.items(variables.listId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists.root });
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

export function useUpdateListProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, providerId }: UpdateListProviderVariables) =>
      updateListProvider(listId, providerId),
    networkMode: 'always',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists.root });
    },
  });
}

export const useAddItem = useAddListItem;
export const useUpdateItem = useUpdateListItem;
export const useRemoveItem = useRemoveListItem;
