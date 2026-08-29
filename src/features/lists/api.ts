import { api, endpoints } from '@/src/shared/api';
import type {
  ListCreateRequest,
  ListDTO,
  ListItemAddRequest,
  ListItemDTO,
  ListItemMutationResponse,
  ListItemRelationUpdateRequest,
  ListUpdateRequest,
  MessageResponse,
  NearbyBranchDTO,
} from '@/src/shared/api/dto';

export type ListEntityId = string | number;

export type ListRouteBranch = Pick<
  NearbyBranchDTO,
  'IdSucursal' | 'NombreSucursal' | 'Latitud' | 'Longitud' | 'IdProveedor' | 'Distancia'
>;

export async function all(userId: ListEntityId): Promise<ListDTO[]> {
  const { data } = await api.get<ListDTO[]>(endpoints.lista);
  const numericUserId = Number(userId);
  return data.filter((list) => list.IdUsuario === numericUserId);
}

export async function items(listId: ListEntityId): Promise<ListItemDTO[]> {
  const { data } = await api.get<ListItemDTO[]>(endpoints.productosDeLista(listId));
  return data;
}

export async function create(payload: ListCreateRequest): Promise<ListDTO> {
  const { data } = await api.post<ListDTO>(endpoints.lista, payload);
  return data;
}

export async function remove(listId: ListEntityId): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>(endpoints.listaById(listId));
  return data;
}

export async function route(providerIds: number[]): Promise<ListRouteBranch[]> {
  const { data } = await api.post<ListRouteBranch[]>(endpoints.rutaMultiplesListas, {
    ids_proveedores: providerIds,
  });
  return data;
}

export async function addItem(payload: ListItemAddRequest): Promise<ListItemMutationResponse> {
  const { data } = await api.post<ListItemMutationResponse>(endpoints.listaProducto, payload);
  return data;
}

export async function updateItem(
  listId: ListEntityId,
  productId: ListEntityId,
  payload: ListItemRelationUpdateRequest,
): Promise<ListItemMutationResponse> {
  const { data } = await api.put<ListItemMutationResponse>(
    endpoints.listaProductoItem(listId, productId),
    payload,
  );
  return data;
}

export async function removeItem(
  listId: ListEntityId,
  productId: ListEntityId,
): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>(
    endpoints.listaProductoItem(listId, productId),
  );
  return data;
}

export async function updateList(
  listId: ListEntityId,
  payload: ListUpdateRequest,
): Promise<ListDTO> {
  const { data } = await api.put<ListDTO>(endpoints.listaById(listId), payload);
  return data;
}

export async function updateListProvider(
  listId: ListEntityId,
  providerId: number,
): Promise<ListDTO> {
  return updateList(listId, { IdProveedor: providerId });
}

export const listsApi = {
  all,
  items,
  create,
  remove,
  route,
  addItem,
  updateItem,
  removeItem,
  updateList,
  updateListProvider,
};
