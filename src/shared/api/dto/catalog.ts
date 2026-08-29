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

export type CategoryDTO = {
  IdCategoria: number;
  NombreCategoria: string;
};

export type UnitDTO = {
  IdUnidadMedida: number;
  NombreUnidadMedida: string;
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

export type ProductPriceDTO = {
  IdProveedor: number;
  NombreProveedor: string;
  UrlImagenProveedor?: string | null;
  Precio: DecimalValue;
  PrecioOferta?: DecimalValue | null;
};

export type ProviderCatalogProductDTO = ProductProviderDTO & {
  Producto: Omit<ProductDTO, 'IdProducto'> & {
    Unidad?: string | null;
  };
};

export type BranchDTO = {
  IdSucursal: number;
  NombreSucursal: string;
  Latitud: DecimalValue;
  Longitud: DecimalValue;
  IdProveedor: number;
};

export type NearbyBranchesRequest = {
  lat: number;
  lng: number;
  ids_productos: number[];
  lista_cantidad: number[];
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
