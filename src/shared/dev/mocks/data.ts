/** Static mock entities — República Dominicana (RD$). */

import { getProductImageUrl, getUnitAbbrev } from '@/src/shared/products/meta';
export { getProductImageUrl, getUnitAbbrev } from '@/src/shared/products/meta';

export const MOCK_USER_ID = 1;

/** Supermercados que reciben precios de productos de despensa. */
export const SUPERMARKET_PROVIDER_IDS = [1, 2, 3, 6, 7, 8] as const;

export const tiposProveedor = [
  { IdTipoProveedor: 1, NombreTipoProveedor: 'Supermercado' },
  { IdTipoProveedor: 2, NombreTipoProveedor: 'Ferretería' },
  { IdTipoProveedor: 3, NombreTipoProveedor: 'Farmacia' },
];

export const proveedores = [
  {
    IdProveedor: 1,
    Nombre: 'Nacional',
    UrlLogo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Nacional_Supermarket_logo.svg/200px-Nacional_Supermarket_logo.svg.png',
    IdTipoProveedor: 1,
  },
  {
    IdProveedor: 2,
    Nombre: 'Jumbo',
    UrlLogo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Jumbo_%28supermarket%29_logo.svg/200px-Jumbo_%28supermarket%29_logo.svg.png',
    IdTipoProveedor: 1,
  },
  {
    IdProveedor: 3,
    Nombre: 'La Sirena',
    UrlLogo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/La_Sirena_logo.svg/200px-La_Sirena_logo.svg.png',
    IdTipoProveedor: 1,
  },
  {
    IdProveedor: 6,
    Nombre: 'Bravo',
    UrlLogo: '',
    IdTipoProveedor: 1,
  },
  {
    IdProveedor: 7,
    Nombre: 'PriceSmart',
    UrlLogo: '',
    IdTipoProveedor: 1,
  },
  {
    IdProveedor: 8,
    Nombre: 'Sirena Market',
    UrlLogo: '',
    IdTipoProveedor: 1,
  },
  {
    IdProveedor: 4,
    Nombre: 'Ferretería Ochoa',
    UrlLogo: '',
    IdTipoProveedor: 2,
  },
  {
    IdProveedor: 5,
    Nombre: 'Farmacia Carol',
    UrlLogo: '',
    IdTipoProveedor: 3,
  },
];

export const unidadesMedida = [
  { IdUnidadMedida: 1, NombreUnidadMedida: 'Unidad' },
  { IdUnidadMedida: 2, NombreUnidadMedida: 'Libra' },
  { IdUnidadMedida: 3, NombreUnidadMedida: 'Litro' },
  { IdUnidadMedida: 4, NombreUnidadMedida: 'Paquete' },
];

export const categorias = [
  { IdCategoria: 1, NombreCategoria: 'Despensa' },
  { IdCategoria: 2, NombreCategoria: 'Lácteos' },
  { IdCategoria: 3, NombreCategoria: 'Carnes' },
  { IdCategoria: 4, NombreCategoria: 'Panadería' },
  { IdCategoria: 5, NombreCategoria: 'Bebidas' },
  { IdCategoria: 6, NombreCategoria: 'Limpieza' },
  { IdCategoria: 7, NombreCategoria: 'Frutas' },
  { IdCategoria: 8, NombreCategoria: 'Verduras' },
  { IdCategoria: 9, NombreCategoria: 'Congelados' },
  { IdCategoria: 10, NombreCategoria: 'Snacks' },
  { IdCategoria: 11, NombreCategoria: 'Higiene personal' },
  { IdCategoria: 12, NombreCategoria: 'Bebés' },
  { IdCategoria: 13, NombreCategoria: 'Mascotas' },
  { IdCategoria: 14, NombreCategoria: 'Condimentos' },
  { IdCategoria: 15, NombreCategoria: 'Granos y cereales' },
];

type ProductSeed = {
  IdProducto: number;
  Nombre: string;
  IdUnidadMedida: number;
  Descripcion: string;
  IdCategoria: number;
  basePrice: number;
  /** Proveedores con PrecioOferta para este producto. */
  offerProviders?: number[];
};

const productSeeds: ProductSeed[] = [
  // Despensa
  { IdProducto: 1, Nombre: 'Arroz La Garza 5 lb', IdUnidadMedida: 4, Descripcion: 'Arroz extra ancho de grano largo.', IdCategoria: 1, basePrice: 289, offerProviders: [1, 3] },
  { IdProducto: 4, Nombre: 'Aceite Cristal 32 oz', IdUnidadMedida: 1, Descripcion: 'Aceite vegetal mezcla.', IdCategoria: 1, basePrice: 425, offerProviders: [2] },
  { IdProducto: 6, Nombre: 'Habichuelas rojas Goya', IdUnidadMedida: 4, Descripcion: 'Habichuelas rojas en lata 15 oz.', IdCategoria: 1, basePrice: 78 },
  { IdProducto: 16, Nombre: 'Pasta Barilla espagueti 500 g', IdUnidadMedida: 4, Descripcion: 'Pasta de sémola de trigo duro.', IdCategoria: 1, basePrice: 125, offerProviders: [6] },
  { IdProducto: 17, Nombre: 'Azúcar Cristal 4 lb', IdUnidadMedida: 4, Descripcion: 'Azúcar refinada.', IdCategoria: 1, basePrice: 195 },
  // Lácteos
  { IdProducto: 3, Nombre: 'Leche Rica entera 1 L', IdUnidadMedida: 3, Descripcion: 'Leche entera pasteurizada.', IdCategoria: 2, basePrice: 95, offerProviders: [3] },
  { IdProducto: 18, Nombre: 'Queso de hoja La Vacita', IdUnidadMedida: 2, Descripcion: 'Queso fresco por libra.', IdCategoria: 2, basePrice: 320, offerProviders: [1, 7] },
  { IdProducto: 19, Nombre: 'Yogurt Yoplait natural', IdUnidadMedida: 1, Descripcion: 'Yogurt natural 170 g.', IdCategoria: 2, basePrice: 55, offerProviders: [2] },
  { IdProducto: 20, Nombre: 'Mantequilla Rica 454 g', IdUnidadMedida: 1, Descripcion: 'Mantequilla con sal.', IdCategoria: 2, basePrice: 245 },
  // Carnes
  { IdProducto: 2, Nombre: 'Pollo entero fresco', IdUnidadMedida: 2, Descripcion: 'Pollo entero refrigerado.', IdCategoria: 3, basePrice: 189, offerProviders: [2] },
  { IdProducto: 21, Nombre: 'Carne de res molida (lb)', IdUnidadMedida: 2, Descripcion: 'Carne molida 80/20.', IdCategoria: 3, basePrice: 420, offerProviders: [1, 6] },
  { IdProducto: 22, Nombre: 'Chuleta de cerdo (lb)', IdUnidadMedida: 2, Descripcion: 'Chuleta fresca de cerdo.', IdCategoria: 3, basePrice: 285 },
  { IdProducto: 23, Nombre: 'Salchichas Induveca 12 uds', IdUnidadMedida: 4, Descripcion: 'Salchichas tipo viena.', IdCategoria: 3, basePrice: 165, offerProviders: [3, 8] },
  // Panadería
  { IdProducto: 7, Nombre: 'Pan de agua', IdUnidadMedida: 1, Descripcion: 'Pan de agua fresco.', IdCategoria: 4, basePrice: 25 },
  { IdProducto: 24, Nombre: 'Pan integral Bimbo', IdUnidadMedida: 4, Descripcion: 'Pan de molde integral.', IdCategoria: 4, basePrice: 185, offerProviders: [2] },
  { IdProducto: 25, Nombre: 'Bizcocho Dona Tita', IdUnidadMedida: 1, Descripcion: 'Bizcocho vainilla individual.', IdCategoria: 4, basePrice: 45 },
  // Bebidas
  { IdProducto: 26, Nombre: 'Jugo Del Valle naranja 1 L', IdUnidadMedida: 3, Descripcion: 'Jugo de naranja 100%.', IdCategoria: 5, basePrice: 135, offerProviders: [1] },
  { IdProducto: 27, Nombre: 'Coca-Cola 2 L', IdUnidadMedida: 1, Descripcion: 'Refresco cola 2 litros.', IdCategoria: 5, basePrice: 115, offerProviders: [3, 6] },
  { IdProducto: 28, Nombre: 'Agua Crystal 6 pack', IdUnidadMedida: 4, Descripcion: 'Agua purificada 500 ml x6.', IdCategoria: 5, basePrice: 175 },
  // Limpieza
  { IdProducto: 8, Nombre: 'Detergente Ace 1 kg', IdUnidadMedida: 4, Descripcion: 'Detergente en polvo.', IdCategoria: 6, basePrice: 165, offerProviders: [1, 2] },
  { IdProducto: 29, Nombre: 'Cloro Clorox 946 ml', IdUnidadMedida: 1, Descripcion: 'Blanqueador desinfectante.', IdCategoria: 6, basePrice: 95, offerProviders: [7] },
  { IdProducto: 30, Nombre: 'Esponja Scotch-Brite 3 uds', IdUnidadMedida: 4, Descripcion: 'Esponjas para cocina.', IdCategoria: 6, basePrice: 85 },
  // Frutas
  { IdProducto: 5, Nombre: 'Plátano maduro (lb)', IdUnidadMedida: 2, Descripcion: 'Plátano maduro por libra.', IdCategoria: 7, basePrice: 35 },
  { IdProducto: 31, Nombre: 'Mango banilejo (lb)', IdUnidadMedida: 2, Descripcion: 'Mango fresco de temporada.', IdCategoria: 7, basePrice: 55, offerProviders: [8] },
  { IdProducto: 32, Nombre: 'Piña golden (unidad)', IdUnidadMedida: 1, Descripcion: 'Piña dulce mediana.', IdCategoria: 7, basePrice: 89 },
  // Verduras
  { IdProducto: 33, Nombre: 'Lechuga romana (unidad)', IdUnidadMedida: 1, Descripcion: 'Lechuga fresca.', IdCategoria: 8, basePrice: 65 },
  { IdProducto: 34, Nombre: 'Tomate saladette (lb)', IdUnidadMedida: 2, Descripcion: 'Tomate fresco por libra.', IdCategoria: 8, basePrice: 48, offerProviders: [6] },
  { IdProducto: 35, Nombre: 'Cebolla blanca (lb)', IdUnidadMedida: 2, Descripcion: 'Cebolla blanca nacional.', IdCategoria: 8, basePrice: 42 },
  // Congelados
  { IdProducto: 36, Nombre: 'Nuggets de pollo Tyson 1 kg', IdUnidadMedida: 4, Descripcion: 'Nuggets congelados.', IdCategoria: 9, basePrice: 395, offerProviders: [2, 7] },
  { IdProducto: 37, Nombre: 'Helado Bon 1.5 L vainilla', IdUnidadMedida: 1, Descripcion: 'Helado de vainilla.', IdCategoria: 9, basePrice: 285, offerProviders: [1] },
  { IdProducto: 38, Nombre: 'Vegetales mixtos congelados', IdUnidadMedida: 4, Descripcion: 'Mezcla de vegetales 500 g.', IdCategoria: 9, basePrice: 175 },
  // Snacks
  { IdProducto: 39, Nombre: 'Papas fritas Lays clásicas', IdUnidadMedida: 4, Descripcion: 'Papas fritas 170 g.', IdCategoria: 10, basePrice: 125, offerProviders: [3] },
  { IdProducto: 40, Nombre: 'Galletas Oreo 154 g', IdUnidadMedida: 4, Descripcion: 'Galletas sándwich chocolate.', IdCategoria: 10, basePrice: 135, offerProviders: [6, 8] },
  // Higiene personal
  { IdProducto: 41, Nombre: 'Shampoo Head & Shoulders 400 ml', IdUnidadMedida: 1, Descripcion: 'Shampoo anticaspa.', IdCategoria: 11, basePrice: 425, offerProviders: [1] },
  { IdProducto: 42, Nombre: 'Pasta dental Colgate 100 ml', IdUnidadMedida: 1, Descripcion: 'Pasta dental triple acción.', IdCategoria: 11, basePrice: 185, offerProviders: [2] },
  { IdProducto: 43, Nombre: 'Jabón Protex 110 g', IdUnidadMedida: 1, Descripcion: 'Jabón antibacterial.', IdCategoria: 11, basePrice: 75 },
  // Bebés
  { IdProducto: 44, Nombre: 'Pañales Huggies talla 4 x 40', IdUnidadMedida: 4, Descripcion: 'Pañales desechables.', IdCategoria: 12, basePrice: 895, offerProviders: [7, 8] },
  { IdProducto: 45, Nombre: 'Fórmula Similac 1 400 g', IdUnidadMedida: 4, Descripcion: 'Leche en polvo etapa 1.', IdCategoria: 12, basePrice: 1250, offerProviders: [1] },
  // Mascotas
  { IdProducto: 46, Nombre: 'Alimento perro Pedigree 2 kg', IdUnidadMedida: 4, Descripcion: 'Concentrado para perros adultos.', IdCategoria: 13, basePrice: 565, offerProviders: [3] },
  { IdProducto: 47, Nombre: 'Alimento gato Whiskas 1.5 kg', IdUnidadMedida: 4, Descripcion: 'Concentrado para gatos.', IdCategoria: 13, basePrice: 485, offerProviders: [6] },
  // Condimentos
  { IdProducto: 48, Nombre: 'Adobo completo Maggi 200 g', IdUnidadMedida: 4, Descripcion: 'Sazonador completo.', IdCategoria: 14, basePrice: 95, offerProviders: [2, 3] },
  { IdProducto: 49, Nombre: 'Sal iodada Refisal 26 oz', IdUnidadMedida: 1, Descripcion: 'Sal de mesa iodada.', IdCategoria: 14, basePrice: 35 },
  // Granos y cereales
  { IdProducto: 50, Nombre: 'Avena Quaker 500 g', IdUnidadMedida: 4, Descripcion: 'Hojuelas de avena.', IdCategoria: 15, basePrice: 165, offerProviders: [1, 7] },
  { IdProducto: 51, Nombre: 'Corn Flakes Kelloggs 750 g', IdUnidadMedida: 4, Descripcion: 'Cereal de maíz.', IdCategoria: 15, basePrice: 325, offerProviders: [8] },
];

export const productos = productSeeds.map(
  ({ basePrice: _b, offerProviders: _o, ...rest }) => ({
    ...rest,
    UrlImagen: getProductImageUrl(rest.IdProducto) as string | null,
  })
);

function generatePreciosMatrix(
  seeds: ProductSeed[]
): Record<number, Record<number, { Precio: string; PrecioOferta?: string }>> {
  const matrix: Record<
    number,
    Record<number, { Precio: string; PrecioOferta?: string }>
  > = {};

  for (const seed of seeds) {
    matrix[seed.IdProducto] = {};
    for (const provId of SUPERMARKET_PROVIDER_IDS) {
      const offset = ((seed.IdProducto * 7 + provId * 3) % 11) - 5;
      const price = Math.max(seed.basePrice + offset, 10);
      const entry: { Precio: string; PrecioOferta?: string } = {
        Precio: price.toFixed(2),
      };
      if (seed.offerProviders?.includes(provId)) {
        entry.PrecioOferta = (price * 0.88).toFixed(2);
      }
      matrix[seed.IdProducto][provId] = entry;
    }
  }
  return matrix;
}

/** Precio base por producto × proveedor supermercado (RD$). */
export const preciosMatrix = generatePreciosMatrix(productSeeds);

export const sucursales = [
  // Nacional
  {
    IdSucursal: 101,
    NombreSucursal: 'Nacional Ágora Mall',
    Latitud: '18.4861',
    Longitud: '-69.9312',
    IdProveedor: 1,
  },
  {
    IdSucursal: 102,
    NombreSucursal: 'Nacional Winston Churchill',
    Latitud: '18.4720',
    Longitud: '-69.9390',
    IdProveedor: 1,
  },
  {
    IdSucursal: 103,
    NombreSucursal: 'Nacional Galería 360',
    Latitud: '18.4812',
    Longitud: '-69.9545',
    IdProveedor: 1,
  },
  // Jumbo
  {
    IdSucursal: 201,
    NombreSucursal: 'Jumbo Luperón',
    Latitud: '18.4554',
    Longitud: '-69.9456',
    IdProveedor: 2,
  },
  {
    IdSucursal: 202,
    NombreSucursal: 'Jumbo Av. Independencia',
    Latitud: '18.4638',
    Longitud: '-69.9298',
    IdProveedor: 2,
  },
  // La Sirena
  {
    IdSucursal: 301,
    NombreSucursal: 'La Sirena Churchill',
    Latitud: '18.4715',
    Longitud: '-69.9385',
    IdProveedor: 3,
  },
  {
    IdSucursal: 302,
    NombreSucursal: 'La Sirena 27 de Febrero',
    Latitud: '18.4592',
    Longitud: '-69.9185',
    IdProveedor: 3,
  },
  // Bravo
  {
    IdSucursal: 601,
    NombreSucursal: 'Bravo Av. Sarasota',
    Latitud: '18.4685',
    Longitud: '-69.9425',
    IdProveedor: 6,
  },
  {
    IdSucursal: 602,
    NombreSucursal: 'Bravo Núñez de Cáceres',
    Latitud: '18.4778',
    Longitud: '-69.9265',
    IdProveedor: 6,
  },
  // PriceSmart
  {
    IdSucursal: 701,
    NombreSucursal: 'PriceSmart Santo Domingo',
    Latitud: '18.4508',
    Longitud: '-69.9565',
    IdProveedor: 7,
  },
  {
    IdSucursal: 702,
    NombreSucursal: 'PriceSmart Arroyo Hondo',
    Latitud: '18.4925',
    Longitud: '-69.9612',
    IdProveedor: 7,
  },
  // Sirena Market
  {
    IdSucursal: 801,
    NombreSucursal: 'Sirena Market Piantini',
    Latitud: '18.4745',
    Longitud: '-69.9345',
    IdProveedor: 8,
  },
  {
    IdSucursal: 802,
    NombreSucursal: 'Sirena Market Evaristo Morales',
    Latitud: '18.4798',
    Longitud: '-69.9288',
    IdProveedor: 8,
  },
];

export function getProveedorById(id: number) {
  return proveedores.find((p) => p.IdProveedor === id) ?? null;
}

export function getProductoById(id: number) {
  return productos.find((p) => p.IdProducto === id) ?? null;
}

export function getCategoriaById(id: number) {
  return categorias.find((c) => c.IdCategoria === id) ?? null;
}

export function getPrecioProductoProveedor(productoId: number, proveedorId: number) {
  return preciosMatrix[productoId]?.[proveedorId] ?? { Precio: '99.00' };
}

export function buildPreciosProductos(productoId: number) {
  const producto = getProductoById(productoId);
  if (!producto) return [];
  return proveedores
    .filter((p) => preciosMatrix[productoId]?.[p.IdProveedor])
    .map((p) => {
      const row = preciosMatrix[productoId][p.IdProveedor];
      return {
        IdProveedor: p.IdProveedor,
        NombreProveedor: p.Nombre,
        UrlImagenProveedor: p.UrlLogo,
        Precio: row.Precio,
        PrecioOferta: row.PrecioOferta ?? null,
      };
    });
}

export function buildPreciosProductosProveedor(proveedorId: number) {
  return productos
    .filter((p) => preciosMatrix[p.IdProducto]?.[proveedorId])
    .map((p) => {
      const row = preciosMatrix[p.IdProducto][proveedorId];
      return {
        IdProducto: p.IdProducto,
        IdProveedor: proveedorId,
        Precio: row.Precio,
        PrecioOferta: row.PrecioOferta ?? null,
        Producto: {
          Nombre: p.Nombre,
          UrlImagen: p.UrlImagen ?? getProductImageUrl(p.IdProducto),
          Descripcion: p.Descripcion,
          IdUnidadMedida: p.IdUnidadMedida,
          IdCategoria: p.IdCategoria,
          Unidad: getUnitAbbrev(p.IdUnidadMedida),
        },
      };
    });
}

export function calcTotalPrecio(
  idsProductos: number[],
  cantidades: number[],
  proveedorId: number
): number {
  let total = 0;
  idsProductos.forEach((pid, i) => {
    const row = getPrecioProductoProveedor(pid, proveedorId);
    const price = Number(row.PrecioOferta ?? row.Precio);
    total += price * (cantidades[i] ?? 1);
  });
  return Math.round(total * 100) / 100;
}

/** Resumen para tests y diagnóstico. */
export function getMockDataStats() {
  const supermarketCount = proveedores.filter((p) => p.IdTipoProveedor === 1).length;
  const productsWithPrices = productos.filter((p) =>
    SUPERMARKET_PROVIDER_IDS.some((id) => preciosMatrix[p.IdProducto]?.[id])
  ).length;
  const offerCount = Object.values(preciosMatrix).reduce(
    (sum, row) => sum + Object.values(row).filter((r) => r.PrecioOferta).length,
    0
  );
  return {
    providers: proveedores.length,
    supermarkets: supermarketCount,
    categories: categorias.length,
    products: productos.length,
    productsWithPrices,
    priceEntries: Object.keys(preciosMatrix).length * SUPERMARKET_PROVIDER_IDS.length,
    offers: offerCount,
    sucursales: sucursales.length,
    lists: 3,
  };
}
