import { parseProductId } from '@/src/features/products/screenSelectors';
import {
  acquireSingleFlight,
  parseIncomingProducts,
  resolveSelectedBranchId,
  resolveEffectiveProviderId,
  selectMapBranches,
} from '@/src/features/providers/screenSelectors';

describe('selectores de pantallas de productos', () => {
  it('deriva el proveedor inicial sin actualizar estado desde un effect', () => {
    const providers = [
      { IdProveedor: 7, Nombre: 'Proveedor inicial' },
      { IdProveedor: 8, Nombre: 'Otro proveedor' },
    ];

    expect(resolveEffectiveProviderId(null, null, providers)).toBe(7);
    expect(resolveEffectiveProviderId(null, 8, providers)).toBe(8);
    expect(resolveEffectiveProviderId(7, 8, providers)).toBe(7);
    expect(
      resolveEffectiveProviderId(null, null, [
        { IdProveedor: 0, Nombre: 'Inválido' },
        ...providers,
      ]),
    ).toBe(7);
  });

  it('acepta params de Expo Router seguros para deep links', () => {
    expect(parseProductId(['19'])).toBe(19);
    expect(parseProductId('19')).toBe(19);
    expect(parseProductId(['0'])).toBeNull();
    expect(parseProductId('no-es-id')).toBeNull();
  });

  it('parsea items codificados y descarta productos o cantidades inválidos', () => {
    const encoded = encodeURIComponent(
      JSON.stringify([
        { IdProducto: 4, Nombre: 'Aceite', Cantidad: 2 },
        { IdProducto: 0, Nombre: 'Inválido', Cantidad: 1 },
        { IdProducto: 5, Nombre: 'Plátano', Cantidad: 0 },
        { IdProducto: 4, Nombre: 'Duplicado', Cantidad: 3 },
      ]),
    );

    expect(parseIncomingProducts(encoded)).toEqual([
      { IdProducto: 4, Nombre: 'Aceite', UrlImagen: '', Cantidad: 2 },
    ]);
    expect(parseIncomingProducts('%7Bmalformado')).toEqual([]);
    expect(parseIncomingProducts(['no-json', encoded])).toEqual([]);
  });

  it('bloquea un segundo guardado mientras el primero está en curso', () => {
    const guard = { current: false };

    expect(acquireSingleFlight(guard)).toBe(true);
    expect(acquireSingleFlight(guard)).toBe(false);
    guard.current = false;
    expect(acquireSingleFlight(guard)).toBe(true);
  });

  it('filtra sucursales por tipo y texto, descarta coordenadas inválidas y ordena por distancia', () => {
    const providers = [
      { IdProveedor: 1, Nombre: 'Nacional', IdTipoProveedor: 1 },
      { IdProveedor: 2, Nombre: 'Farmacia Carol', IdTipoProveedor: 3 },
    ];
    const branches = [
      {
        IdSucursal: 11,
        NombreSucursal: 'Nacional Lejana',
        Latitud: '18.50',
        Longitud: '-69.93',
        IdProveedor: 1,
      },
      {
        IdSucursal: 12,
        NombreSucursal: 'Farmacia Carol Centro',
        Latitud: 18.4862,
        Longitud: -69.9311,
        IdProveedor: 2,
      },
      {
        IdSucursal: 13,
        NombreSucursal: 'Nacional inválida',
        Latitud: 'no-coordinate',
        Longitud: '-69.93',
        IdProveedor: 1,
      },
    ];

    expect(
      selectMapBranches(branches, providers, 3, 'centro', {
        latitude: 18.4861,
        longitude: -69.9312,
      }),
    ).toEqual([
      expect.objectContaining({
        IdSucursal: 12,
        lat: 18.4862,
        lng: -69.9311,
      }),
    ]);
    expect(
      selectMapBranches(branches, providers, 'all', '', {
        latitude: 18.4861,
        longitude: -69.9312,
      }).map((branch) => branch.IdSucursal),
    ).toEqual([12, 11]);
  });

  it('conserva la selección válida y usa fallback puro cuando deja de existir', () => {
    const branches = [
      {
        IdSucursal: 21,
        NombreSucursal: 'Primera',
        Latitud: '18.48',
        Longitud: '-69.93',
        IdProveedor: 1,
        lat: 18.48,
        lng: -69.93,
        distanceKm: 1,
      },
      {
        IdSucursal: 22,
        NombreSucursal: 'Segunda',
        Latitud: '18.49',
        Longitud: '-69.94',
        IdProveedor: 1,
        lat: 18.49,
        lng: -69.94,
        distanceKm: 2,
      },
    ];

    expect(resolveSelectedBranchId(22, branches)).toBe(22);
    expect(resolveSelectedBranchId(99, branches)).toBe(21);
    expect(resolveSelectedBranchId(null, [])).toBeNull();
  });
});
