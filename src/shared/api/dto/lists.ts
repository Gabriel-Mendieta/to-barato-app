import type { DecimalValue } from './auth';

export type ListDTO = {
  IdUsuario: number;
  IdProveedor: number;
  Nombre: string;
  PrecioTotal: DecimalValue;
  IdLista: number;
  FechaCreacion: string;
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
