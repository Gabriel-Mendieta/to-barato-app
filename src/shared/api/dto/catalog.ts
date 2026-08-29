import type { DecimalValue } from './auth';

export type ProviderDTO = {
  IdProveedor: number;
  Nombre: string;
  UrlLogo?: string | null;
  IdTipoProveedor?: number;
};

export type ProviderTypeDTO = {
  IdTipoProveedor: number;
  NombreTipoProveedor: string;
};

export type ProductDTO = {
  IdProducto: number;
  IdCategoria?: number;
  IdUnidadMedida?: number;
  Nombre: string;
  UrlImagen?: string | null;
  Descripcion?: string | null;
};

export type ProductProviderDTO = {
  IdProducto: number;
  IdProveedor: number;
  Precio: DecimalValue;
  PrecioOferta?: DecimalValue | null;
  DescripcionOferta?: string | null;
  FechaOferta?: string | null;
  FechaPrecio?: string | null;
};

export type NearbyBranchDTO = {
  IdSucursal: number;
  NombreSucursal: string;
  Latitud: DecimalValue;
  Longitud: DecimalValue;
  IdProveedor: number;
  Precio: DecimalValue;
  Distancia: DecimalValue;
};
