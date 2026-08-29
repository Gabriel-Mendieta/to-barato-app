import { api, endpoints } from '@/src/shared/api';
import { setOfflineMode, __resetDevModeForTests } from '@/src/shared/dev';
import {
  addItem,
  all as allLists,
  removeItem,
  updateItem,
  updateListProvider,
} from '@/src/features/lists/api';
import { catalogByType, categories, prices, units } from '@/src/features/products/api';
import { nearby, byId as providerById } from '@/src/features/providers/api';
import { listKeys, productKeys, providerKeys } from '@/src/shared/api/queryClient';

describe('APIs y query keys de dominios', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    __resetDevModeForTests();
  });

  it('filtra listas por usuario y conserva el usuario en la key', async () => {
    jest.spyOn(api, 'get').mockResolvedValue({
      data: [
        { IdUsuario: 7, IdLista: 1 },
        { IdUsuario: 8, IdLista: 2 },
      ],
    } as never);

    await expect(allLists(7)).resolves.toEqual([{ IdUsuario: 7, IdLista: 1 }]);
    expect(api.get).toHaveBeenCalledWith(endpoints.lista);
    expect(listKeys.all(7)).not.toEqual(listKeys.all(8));
  });

  it('usa las rutas y payloads existentes para mutaciones de listas', async () => {
    jest.spyOn(api, 'post').mockResolvedValue({ data: {} } as never);
    jest.spyOn(api, 'put').mockResolvedValue({ data: {} } as never);
    jest.spyOn(api, 'delete').mockResolvedValue({ data: {} } as never);

    const addPayload = {
      IdLista: 3,
      IdProducto: 9,
      PrecioActual: '10.00',
      Cantidad: 2,
    };
    await addItem(addPayload);
    await updateItem(3, 9, { Cantidad: 4 });
    await removeItem(3, 9);
    await updateListProvider(3, 4);

    expect(api.post).toHaveBeenCalledWith(endpoints.listaProducto, addPayload);
    expect(api.put).toHaveBeenNthCalledWith(1, endpoints.listaProductoItem(3, 9), { Cantidad: 4 });
    expect(api.delete).toHaveBeenCalledWith(endpoints.listaProductoItem(3, 9));
    expect(api.put).toHaveBeenNthCalledWith(2, endpoints.listaById(3), {
      IdProveedor: 4,
    });
  });

  it('llama catálogo por tipo, precios, categorías y unidades', async () => {
    jest.spyOn(api, 'get').mockResolvedValue({ data: [] } as never);

    await catalogByType(2);
    await prices(9);
    await categories();
    await units();

    expect(api.get).toHaveBeenNthCalledWith(1, endpoints.productoTipoProveedor(2));
    expect(api.get).toHaveBeenNthCalledWith(2, endpoints.preciosProductos(9));
    expect(api.get).toHaveBeenNthCalledWith(3, endpoints.categoria);
    expect(api.get).toHaveBeenNthCalledWith(4, endpoints.unidadmedida);
    expect(productKeys.prices(9)).not.toEqual(productKeys.prices(10));
  });

  it('llama detalle de proveedor y nearby con su payload serializable', async () => {
    jest.spyOn(api, 'get').mockResolvedValue({ data: {} } as never);
    jest.spyOn(api, 'post').mockResolvedValue({ data: [] } as never);
    const payload = {
      lat: 18.48,
      lng: -69.93,
      ids_productos: [1, 3],
      lista_cantidad: [1, 2],
    };

    await providerById(4);
    await nearby(payload);

    expect(api.get).toHaveBeenCalledWith(endpoints.proveedorById(4));
    expect(api.post).toHaveBeenCalledWith(endpoints.sucursalCercana, payload);
    expect(providerKeys.byId(4)).not.toEqual(providerKeys.byId(5));
    expect(providerKeys.nearby(payload)).toEqual(providerKeys.nearby({ ...payload }));
  });

  it('mantiene APIs compatibles con el adaptador offline', async () => {
    __resetDevModeForTests();
    await setOfflineMode(true);
    const response = await providerById(1);
    expect(response.IdProveedor).toBe(1);
  });
});
