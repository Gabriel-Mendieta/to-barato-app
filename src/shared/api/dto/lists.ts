import type { DecimalValue } from './auth';

export type ListDTO = {
  IdUsuario: number;
  IdProveedor: number;
  Nombre: string;
  PrecioTotal: DecimalValue;
  IdLista: number;
  FechaCreacion: string;
};

export type ListCreateRequest = {
  IdUsuario: number;
  IdProveedor: number;
  Nombre: string;
  PrecioTotal: DecimalValue;
};

export type ListItemDTO = {
  IdLista?: number;
  IdProducto: number;
  PrecioActual: DecimalValue;
  Cantidad: number;
};

export type ListItemRelationUpdateRequest = {
  PrecioActual?: DecimalValue;
  Cantidad?: number;
};

export type ListItemAddRequest = {
  IdLista: number;
  IdProducto: number;
  PrecioActual: DecimalValue;
  Cantidad: number;
};

export type ListUpdateRequest = {
  Nombre?: string;
  IdProveedor?: number;
  PrecioTotal?: DecimalValue;
};

export type ListItemMutationResponse = Partial<ListItemDTO> & {
  message?: string;
  error?: boolean;
};
