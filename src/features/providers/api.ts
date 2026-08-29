import { api, endpoints } from '@/src/shared/api';
import type {
  BranchDTO,
  NearbyBranchDTO,
  NearbyBranchesRequest,
  ProviderDTO,
  ProviderTypeDTO,
} from '@/src/shared/api/dto';

export type ProviderEntityId = string | number;

export async function all(): Promise<ProviderDTO[]> {
  const { data } = await api.get<ProviderDTO[]>(endpoints.proveedor);
  return data;
}

export async function byId(providerId: ProviderEntityId): Promise<ProviderDTO> {
  const { data } = await api.get<ProviderDTO>(endpoints.proveedorById(providerId));
  return data;
}

export async function types(): Promise<ProviderTypeDTO[]> {
  const { data } = await api.get<ProviderTypeDTO[]>(endpoints.tipoproveedor);
  return data;
}

export async function branches(): Promise<BranchDTO[]> {
  const { data } = await api.get<BranchDTO[]>(endpoints.sucursal);
  return data;
}

export async function nearby(payload: NearbyBranchesRequest): Promise<NearbyBranchDTO[]> {
  const { data } = await api.post<NearbyBranchDTO[]>(endpoints.sucursalCercana, payload);
  return data;
}

export const providersApi = {
  all,
  byId,
  types,
  branches,
  nearby,
};
