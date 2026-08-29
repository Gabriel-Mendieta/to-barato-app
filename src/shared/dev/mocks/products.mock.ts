import {
  buildPreciosProductos,
  buildPreciosProductosProveedor,
  productos,
} from './data';

function mapProducto(p: (typeof productos)[number]) {
  return {
    IdProducto: p.IdProducto,
    Nombre: p.Nombre,
    UrlImagen: p.UrlImagen,
    IdCategoria: p.IdCategoria,
    IdUnidadMedida: p.IdUnidadMedida,
  };
}

export function handleGetProductos() {
  return productos.map(mapProducto);
}

export function handleGetProductoById(id: number) {
  const p = productos.find((x) => x.IdProducto === id);
  if (!p) return null;
  return {
    IdProducto: p.IdProducto,
    Nombre: p.Nombre,
    UrlImagen: p.UrlImagen,
    IdUnidadMedida: p.IdUnidadMedida,
    IdCategoria: p.IdCategoria,
    Descripcion: p.Descripcion,
  };
}

export function handleGetProductosTipoProveedor(tipoId: number) {
  // Supermercado (1) → all grocery products; others → subset
  if (tipoId === 1) return handleGetProductos();
  if (tipoId === 2) {
    return productos.slice(0, 2).map(mapProducto);
  }
  return productos.slice(2, 5).map(mapProducto);
}

export function handleGetPreciosProductos(productoId: number) {
  return buildPreciosProductos(productoId);
}

export function handleGetPreciosProductosProveedor(proveedorId: number) {
  return buildPreciosProductosProveedor(proveedorId);
}
