import { categorias, proveedores, sucursales, tiposProveedor, unidadesMedida } from './data';

export function handleGetTiposProveedor() {
  return tiposProveedor;
}

export function handleGetProveedores() {
  return proveedores;
}

export function handleGetProveedorById(id: number) {
  return proveedores.find((p) => p.IdProveedor === id) ?? null;
}

export function handleGetSucursales() {
  return sucursales;
}

export function handleGetUnidadMedida() {
  return unidadesMedida;
}

export function handleGetCategoria() {
  return categorias;
}
