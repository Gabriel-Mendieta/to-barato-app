import { parseProductId } from '@/src/features/products/screenSelectors';
import {
  acquireSingleFlight,
  parseIncomingProducts,
  resolveEffectiveProviderId,
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
});
