import {
  SUPERMARKET_PROVIDER_IDS,
  categorias,
  getMockDataStats,
  preciosMatrix,
  productos,
  proveedores,
} from '../mocks/data';

describe('mock data stats', () => {
  it('reports at least 15 categories', () => {
    const stats = getMockDataStats();
    expect(stats.categories).toBeGreaterThanOrEqual(15);
    expect(categorias).toHaveLength(stats.categories);
  });

  it('reports at least 6 supermarkets', () => {
    const stats = getMockDataStats();
    expect(stats.supermarkets).toBeGreaterThanOrEqual(6);
    const supermarketNames = proveedores
      .filter((p) => p.IdTipoProveedor === 1)
      .map((p) => p.Nombre);
    expect(supermarketNames).toEqual(
      expect.arrayContaining(['Nacional', 'Jumbo', 'La Sirena', 'Bravo', 'PriceSmart'])
    );
  });

  it('assigns prices for every product across supermarket providers', () => {
    const stats = getMockDataStats();
    expect(stats.products).toBeGreaterThanOrEqual(40);
    expect(stats.productsWithPrices).toBe(stats.products);

    for (const product of productos) {
      for (const provId of SUPERMARKET_PROVIDER_IDS) {
        const row = preciosMatrix[product.IdProducto]?.[provId];
        expect(row).toBeDefined();
        expect(row!.Precio).toMatch(/^\d+\.\d{2}$/);
      }
    }
  });

  it('includes offer prices in the price matrix', () => {
    const stats = getMockDataStats();
    expect(stats.offers).toBeGreaterThan(0);

    const withOffer = Object.values(preciosMatrix).some((row) =>
      Object.values(row).some((cell) => cell.PrecioOferta != null)
    );
    expect(withOffer).toBe(true);
  });

  it('assigns seeded UrlImagen to every product', () => {
    for (const product of productos) {
      expect(product.UrlImagen).toMatch(
        /^https:\/\/picsum\.photos\/seed\/tobarato-/
      );
    }
  });
});
