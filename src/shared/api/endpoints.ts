/**
 * Relative API paths only. Base URL lives in `src/shared/config/env.ts`.
 * Do not invent routes — keep parity with the existing backend contract.
 */
export const endpoints = {
  login: 'login',
  signup: 'signup',
  solicitarOtp: 'solicitar-otp',
  verificarOtp: 'verificar-otp',
  changePassword: 'change-password',
  /** GET with the refresh token in Authorization: Bearer <refresh_token>. */
  refresh: 'refresh_token',

  usuario: (id: string | number) => `usuario/${id}`,

  tipoproveedor: 'tipoproveedor',
  proveedor: 'proveedor',
  proveedorById: (id: string | number) => `proveedor/${id}`,
  sucursal: 'sucursal',
  sucursalCercana: 'sucursal-cercana',
  rutaMultiplesListas: 'ruta-multiples-listas',

  categoria: 'categoria',
  unidadmedida: 'unidadmedida',
  producto: 'producto',
  productoById: (id: string | number) => `producto/${id}`,
  productoTipoProveedor: (tipoId: string | number) =>
    `productotipoproveedor/${tipoId}`,
  preciosProductos: (productoId: string | number) =>
    `precios-productos/${productoId}`,
  preciosProductosProveedor: (proveedorId: string | number) =>
    `precios-productos/proveedor/${proveedorId}`,
  productoProveedor: (productoId: string | number, proveedorId: string | number) =>
    `productos/${productoId}/proveedores/${proveedorId}`,

  lista: 'lista',
  listaById: (id: string | number) => `lista/${id}`,
  productosDeLista: (idLista: string | number) => `productosdelista/${idLista}`,
  listaProducto: 'listaproducto',
  /** Documented list-product relation used to update or delete an item. */
  listaProductoItem: (idLista: string | number, idProducto: string | number) =>
    `listas/${idLista}/productos/${idProducto}`,

  analizarPregunta: 'dashboard/analizar-pregunta',
} as const;
