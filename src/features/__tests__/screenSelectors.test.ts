import { parseProductId } from '@/src/features/products/screenSelectors';
import { resolveEffectiveProviderId } from '@/src/features/providers/screenSelectors';

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
});
