import { api, endpoints } from '@/src/shared/api';
import type { UserDTO } from '@/src/shared/api/dto';

export type UpdateUserPayload = Partial<
  Pick<UserDTO, 'NombreUsuario' | 'Telefono' | 'Nombres' | 'Apellidos' | 'UrlPerfil'>
>;

export async function getUser(userId: string | number): Promise<UserDTO> {
  const { data } = await api.get<UserDTO>(endpoints.usuario(userId));
  return data;
}

export async function updateUser(
  userId: string | number,
  payload: UpdateUserPayload,
): Promise<UserDTO> {
  const { data } = await api.put<UserDTO>(endpoints.usuario(userId), payload);
  return data;
}
