import {
  MOCK_USER_ID,
  calcTotalPrecio,
  getPrecioProductoProveedor,
  getProductoById,
  getProveedorById,
  sucursales,
} from './data';

type Lista = {
  IdUsuario: number;
  IdProveedor: number;
  Nombre: string;
  PrecioTotal: string;
  IdLista: number;
  FechaCreacion: string;
};

type ProductoEnLista = {
  IdProducto: number;
  PrecioActual: string;
  Cantidad: number;
};

let nextListaId = 3;
let listas: Lista[] = [
  {
    IdUsuario: MOCK_USER_ID,
    IdProveedor: 1,
    Nombre: 'Compras semana',
    PrecioTotal: '623.00',
    IdLista: 1,
    FechaCreacion: '2025-08-01T10:00:00Z',
  },
  {
    IdUsuario: MOCK_USER_ID,
    IdProveedor: 2,
    Nombre: 'Desayuno',
    PrecioTotal: '117.00',
    IdLista: 2,
    FechaCreacion: '2025-08-10T14:30:00Z',
  },
];

const productosPorLista: Record<number, ProductoEnLista[]> = {
  1: [
    { IdProducto: 1, PrecioActual: '259.00', Cantidad: 1 },
    { IdProducto: 3, PrecioActual: '95.00', Cantidad: 2 },
    { IdProducto: 7, PrecioActual: '25.00', Cantidad: 4 },
  ],
  2: [
    { IdProducto: 3, PrecioActual: '92.00', Cantidad: 1 },
    { IdProducto: 7, PrecioActual: '24.00', Cantidad: 1 },
  ],
};

export function handleGetListas() {
  return [...listas];
}

export function handleGetProductosDeLista(idLista: number) {
  return productosPorLista[idLista] ?? [];
}

export function handleGetListaProducto(idLista: number, idProducto: number) {
  const item = (productosPorLista[idLista] ?? []).find(
    (product) => product.IdProducto === idProducto
  );
  return item
    ? { IdLista: idLista, ...item }
    : { message: 'Producto no está en la lista (mock)', error: true };
}

export function handlePostLista(body: Record<string, unknown>) {
  const id = nextListaId++;
  const lista: Lista = {
    IdUsuario: Number(body.IdUsuario ?? MOCK_USER_ID),
    IdProveedor: Number(body.IdProveedor),
    Nombre: String(body.Nombre ?? 'Nueva lista'),
    PrecioTotal: String(body.PrecioTotal ?? '0.00'),
    IdLista: id,
    FechaCreacion: new Date().toISOString(),
  };
  listas.push(lista);
  productosPorLista[id] = [];
  return { ...lista, IdLista: id };
}

function recalcListaTotal(idLista: number) {
  const lista = listas.find((l) => l.IdLista === idLista);
  if (!lista) return;
  const items = productosPorLista[idLista] ?? [];
  const total = items.reduce(
    (sum, i) => sum + Number(i.PrecioActual) * i.Cantidad,
    0
  );
  lista.PrecioTotal = total.toFixed(2);
}

function resolvePrecioForLista(
  idLista: number,
  idProducto: number,
  precioRaw: string | undefined
): string {
  const parsed = precioRaw != null ? Number(precioRaw) : 0;
  if (Number.isFinite(parsed) && parsed > 0) {
    return Number(parsed).toFixed(2);
  }
  // Sin precio fijado: dejar 0.00; el detalle aplica precios por proveedor.
  // Si la lista ya tiene IdProveedor, opcionalmente rellenar desde matrix.
  const lista = listas.find((l) => l.IdLista === idLista);
  if (lista?.IdProveedor) {
    const row = getPrecioProductoProveedor(idProducto, lista.IdProveedor);
    const v = Number(row.PrecioOferta ?? row.Precio);
    if (Number.isFinite(v) && v > 0) return v.toFixed(2);
  }
  return '0.00';
}

function repriceListaItems(idLista: number, idProveedor: number) {
  const items = productosPorLista[idLista] ?? [];
  for (const item of items) {
    const row = getPrecioProductoProveedor(item.IdProducto, idProveedor);
    const v = Number(row.PrecioOferta ?? row.Precio);
    item.PrecioActual = Number.isFinite(v) ? v.toFixed(2) : item.PrecioActual;
  }
  recalcListaTotal(idLista);
}

export function handlePutLista(idLista: number, body: Record<string, unknown>) {
  const lista = listas.find((l) => l.IdLista === idLista);
  if (!lista) {
    return { message: 'Lista no encontrada (mock)', error: true };
  }
  if (body.Nombre != null) lista.Nombre = String(body.Nombre);
  if (body.IdProveedor != null) {
    const nextProv = Number(body.IdProveedor);
    lista.IdProveedor = nextProv;
    repriceListaItems(idLista, nextProv);
  }
  return { ...lista };
}

export function handlePostListaProducto(body: Record<string, unknown>) {
  const idLista = Number(body.IdLista);
  const idProducto = Number(body.IdProducto);
  const cantidad = Number(body.Cantidad ?? 1);
  const precio = resolvePrecioForLista(
    idLista,
    idProducto,
    body.PrecioActual != null ? String(body.PrecioActual) : undefined
  );
  if (!productosPorLista[idLista]) productosPorLista[idLista] = [];

  const existing = productosPorLista[idLista].find(
    (p) => p.IdProducto === idProducto
  );
  if (existing) {
    existing.Cantidad = cantidad;
    if (body.PrecioActual != null) existing.PrecioActual = precio;
    recalcListaTotal(idLista);
    return { message: 'Cantidad actualizada (mock)', ...existing };
  }

  const entry: ProductoEnLista = {
    IdProducto: idProducto,
    PrecioActual: precio,
    Cantidad: cantidad,
  };
  productosPorLista[idLista].push(entry);
  recalcListaTotal(idLista);
  return { message: 'Producto agregado (mock)', ...entry };
}

export function handlePutListaProducto(
  idLista: number,
  idProducto: number,
  body: Record<string, unknown>
) {
  const items = productosPorLista[idLista] ?? [];
  const entry = items.find((p) => p.IdProducto === idProducto);
  if (!entry) {
    return { message: 'Producto no está en la lista (mock)', error: true };
  }
  if (body.Cantidad != null) entry.Cantidad = Math.max(1, Number(body.Cantidad));
  if (body.PrecioActual != null) entry.PrecioActual = String(body.PrecioActual);
  recalcListaTotal(idLista);
  return { message: 'Producto actualizado (mock)', ...entry };
}

export function handleDeleteListaProducto(idLista: number, idProducto: number) {
  const items = productosPorLista[idLista] ?? [];
  productosPorLista[idLista] = items.filter((p) => p.IdProducto !== idProducto);
  recalcListaTotal(idLista);
  return { message: 'Producto eliminado de la lista (mock)' };
}

export function handleDeleteLista(idLista: number) {
  listas = listas.filter((l) => l.IdLista !== idLista);
  delete productosPorLista[idLista];
  return { message: 'Lista eliminada (mock)' };
}

export function handleSucursalCercana(body: Record<string, unknown>) {
  const ids = (body.ids_productos as number[]) ?? [];
  const cantidades = (body.lista_cantidad as number[]) ?? ids.map(() => 1);
  const proveedorIds = new Set(sucursales.map((s) => s.IdProveedor));

  return Array.from(proveedorIds).map((provId) => {
    const suc = sucursales.find((s) => s.IdProveedor === provId)!;
    const precio = calcTotalPrecio(ids, cantidades, provId);
    return {
      IdSucursal: suc.IdSucursal,
      NombreSucursal: suc.NombreSucursal,
      Latitud: Number(suc.Latitud),
      Longitud: Number(suc.Longitud),
      IdProveedor: provId,
      Precio: precio,
      Distancia: Math.round(Math.random() * 5 * 10) / 10 + 0.5,
    };
  });
}

export function handleRutaMultiplesListas(body: Record<string, unknown>) {
  const provIds = (body.ids_proveedores as number[]) ?? [];
  return provIds
    .map((provId) => {
      const suc = sucursales.find((s) => s.IdProveedor === provId);
      if (!suc) return null;
      return {
        IdSucursal: suc.IdSucursal,
        NombreSucursal: suc.NombreSucursal,
        Latitud: Number(suc.Latitud),
        Longitud: Number(suc.Longitud),
        IdProveedor: provId,
        Distancia: Math.round(Math.random() * 4 * 10) / 10 + 1,
      };
    })
    .filter(Boolean);
}

export function __resetListsMockForTests() {
  nextListaId = 3;
  listas = [
    {
      IdUsuario: MOCK_USER_ID,
      IdProveedor: 1,
      Nombre: 'Compras semana',
      PrecioTotal: '623.00',
      IdLista: 1,
      FechaCreacion: '2025-08-01T10:00:00Z',
    },
    {
      IdUsuario: MOCK_USER_ID,
      IdProveedor: 2,
      Nombre: 'Desayuno',
      PrecioTotal: '117.00',
      IdLista: 2,
      FechaCreacion: '2025-08-10T14:30:00Z',
    },
  ];
  productosPorLista[1] = [
    { IdProducto: 1, PrecioActual: '259.00', Cantidad: 1 },
    { IdProducto: 3, PrecioActual: '95.00', Cantidad: 2 },
    { IdProducto: 7, PrecioActual: '25.00', Cantidad: 4 },
  ];
  productosPorLista[2] = [
    { IdProducto: 3, PrecioActual: '92.00', Cantidad: 1 },
    { IdProducto: 7, PrecioActual: '24.00', Cantidad: 1 },
  ];
}

// re-export for product-proveedor price lookup used by lists flow
export { getPrecioProductoProveedor, getProductoById, getProveedorById };
