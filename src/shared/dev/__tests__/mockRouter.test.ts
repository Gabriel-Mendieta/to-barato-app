import * as SecureStore from 'expo-secure-store';
import {
  __resetDevModeForTests,
  initDevMode,
  isOfflineMode,
  setOfflineMode,
} from '../devMode';
import { setMockDelayMs } from '../mockDelay';
import { routeMock } from '../mockRouter';
import { __resetAuthMockForTests } from '../mocks/auth.mock';
import { MOCK_USER_ID, productos } from '../mocks/data';
import { __resetListsMockForTests } from '../mocks/lists.mock';

const USUARIO_FIELDS = [
  'IdTipoUsuario',
  'NombreUsuario',
  'Correo',
  'Telefono',
  'Clave',
  'Nombres',
  'Apellidos',
  'Estado',
  'UrlPerfil',
  'FechaNacimiento',
  'IdUsuario',
  'FechaCreacion',
] as const;

function isMockImplemented(result: unknown): boolean {
  if (
    result &&
    typeof result === 'object' &&
    'message' in result &&
    typeof (result as { message: string }).message === 'string' &&
    (result as { message: string }).message.startsWith('Mock no implementado')
  ) {
    return false;
  }
  return true;
}

async function callMock(
  method: string,
  path: string,
  data: unknown = {},
  params: Record<string, string> = {}
) {
  return routeMock({ method, path, params, data });
}

/** Routes referenced from app/ and core/ — must stay in sync with grep audit. */
const APP_API_ROUTES: Array<{
  method: string;
  path: string;
  data?: unknown;
}> = [
  { method: 'POST', path: 'login', data: { Correo: 'test@example.com', Clave: 'x' } },
  { method: 'POST', path: 'solicitar-otp' },
  { method: 'POST', path: 'signup', data: { Correo: 'test@example.com' } },
  { method: 'GET', path: 'refresh_token' },
  { method: 'POST', path: 'verificar-otp' },
  { method: 'GET', path: `usuario/${MOCK_USER_ID}` },
  { method: 'PUT', path: `usuario/${MOCK_USER_ID}`, data: { Telefono: '8090000000' } },
  { method: 'DELETE', path: `usuario/${MOCK_USER_ID}` },
  { method: 'PUT', path: 'change-password', data: { IdUsuario: MOCK_USER_ID, Clave: 'old', ClaveNueva: 'new123' } },
  { method: 'GET', path: 'tipoproveedor' },
  { method: 'GET', path: 'proveedor' },
  { method: 'GET', path: 'proveedor/1' },
  { method: 'GET', path: 'sucursal' },
  { method: 'GET', path: 'categoria' },
  { method: 'GET', path: 'unidadmedida' },
  { method: 'GET', path: 'producto' },
  { method: 'GET', path: 'producto/1' },
  { method: 'GET', path: 'productotipoproveedor/1' },
  { method: 'GET', path: 'precios-productos/1' },
  { method: 'GET', path: 'precios-productos/proveedor/1' },
  { method: 'GET', path: 'productos/1/proveedores/1' },
  { method: 'GET', path: 'lista' },
  { method: 'POST', path: 'lista', data: { IdProveedor: 1, Nombre: 'Test', PrecioTotal: '0' } },
  { method: 'PUT', path: 'lista/1', data: { IdProveedor: 2 } },
  { method: 'DELETE', path: 'lista/99' },
  { method: 'GET', path: 'productosdelista/1' },
  { method: 'POST', path: 'listaproducto', data: { IdLista: 1, IdProducto: 2, Cantidad: 1, PrecioActual: '10.00' } },
  { method: 'GET', path: 'listas/1/productos/2' },
  { method: 'PUT', path: 'listas/1/productos/2', data: { Cantidad: 3 } },
  { method: 'DELETE', path: 'listas/1/productos/2' },
  { method: 'POST', path: 'sucursal-cercana', data: { ids_productos: [1, 3], lista_cantidad: [1, 2] } },
  { method: 'POST', path: 'ruta-multiples-listas', data: { ids_proveedores: [1, 2] } },
  { method: 'POST', path: 'dashboard/analizar-pregunta', data: { pregunta: 'Receta con arroz' } },
];

describe('devMode', () => {
  beforeEach(async () => {
    __resetDevModeForTests();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it('defaults to online when nothing persisted', async () => {
    await initDevMode();
    expect(isOfflineMode()).toBe(false);
  });

  it('persists offline toggle via SecureStore', async () => {
    await setOfflineMode(true);
    expect(isOfflineMode()).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('dev_offline_mode', '1');

    __resetDevModeForTests();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('1');
    await initDevMode();
    expect(isOfflineMode()).toBe(true);
  });
});

describe('mockRouter', () => {
  beforeEach(() => {
    setMockDelayMs(0);
    __resetAuthMockForTests();
    __resetListsMockForTests();
  });

  afterAll(() => {
    setMockDelayMs(null);
  });

  it('login accepts any credentials and returns tokens', async () => {
    const data = await callMock('POST', 'login', {
      Correo: 'test@example.com',
      Clave: 'x',
    });
    expect(data).toMatchObject({
      tokens: {
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      },
      usuario: { id: expect.any(Number), email: 'test@example.com' },
    });
  });

  it('refresh returns a new access token', async () => {
    const data = await callMock('GET', 'refresh_token');
    expect(data).toHaveProperty('access_token');
  });

  it('solicitar-otp returns success message', async () => {
    const data = (await callMock('POST', 'solicitar-otp')) as { message: string };
    expect(data.message).toMatch(/OTP/i);
  });

  it('verificar-otp returns success message', async () => {
    const data = (await callMock('POST', 'verificar-otp', {}, {
      email: 'test@example.com',
      codigo: '123456',
    })) as { message: string };
    expect(data.message).toMatch(/OTP/i);
  });

  it('returns DR supermarket providers', async () => {
    const data = (await callMock('GET', 'proveedor')) as Array<{ Nombre: string }>;
    const names = data.map((p) => p.Nombre);
    expect(names).toEqual(expect.arrayContaining(['Nacional', 'Jumbo', 'La Sirena']));
  });

  it('returns 15 categories', async () => {
    const data = (await callMock('GET', 'categoria')) as Array<{ IdCategoria: number }>;
    expect(data).toHaveLength(15);
  });

  it('returns seeded shopping lists', async () => {
    const data = (await callMock('GET', 'lista')) as Array<{ Nombre: string }>;
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0].Nombre).toBeTruthy();
  });

  it('returns products for productotipoproveedor (supermarket)', async () => {
    const data = (await callMock('GET', 'productotipoproveedor/1')) as Array<{
      IdProducto: number;
      Nombre: string;
    }>;
    expect(data.length).toBe(productos.length);
    expect(data[0]).toMatchObject({
      IdProducto: expect.any(Number),
      Nombre: expect.any(String),
    });
  });

  it('productotipoproveedor products have prices in the matrix', async () => {
    const products = (await callMock('GET', 'productotipoproveedor/1')) as Array<{
      IdProducto: number;
    }>;
    const sample = products.slice(0, 5);
    for (const p of sample) {
      const prices = (await callMock('GET', `precios-productos/${p.IdProducto}`)) as Array<{
        Precio: string;
      }>;
      expect(prices.length).toBeGreaterThanOrEqual(6);
      expect(prices[0].Precio).toMatch(/^\d+\.\d{2}$/);
    }
  });

  it('precios-productos/:id returns multiple providers with Precio/PrecioOferta', async () => {
    const data = (await callMock('GET', 'precios-productos/1')) as Array<{
      IdProveedor: number;
      NombreProveedor: string;
      Precio: string;
      PrecioOferta: string | null;
    }>;
    expect(data.length).toBeGreaterThanOrEqual(6);
    expect(data[0]).toMatchObject({
      IdProveedor: expect.any(Number),
      NombreProveedor: expect.any(String),
      Precio: expect.stringMatching(/^\d+\.\d{2}$/),
    });
    const withOffer = data.some((row) => row.PrecioOferta != null);
    expect(withOffer).toBe(true);
  });

  it('precios-productos/proveedor/:id returns catalog with prices', async () => {
    const data = (await callMock('GET', 'precios-productos/proveedor/1')) as Array<{
      IdProducto: number;
      Precio: string;
      Producto: { Nombre: string };
    }>;
    expect(data.length).toBe(productos.length);
    expect(data[0]).toMatchObject({
      IdProducto: expect.any(Number),
      Precio: expect.stringMatching(/^\d+\.\d{2}$/),
      Producto: { Nombre: expect.any(String) },
    });
  });

  it('productos/:id/proveedores/:id returns price pair', async () => {
    const data = (await callMock('GET', 'productos/1/proveedores/1')) as {
      IdProducto: number;
      IdProveedor: number;
      Precio: string;
    };
    expect(data).toMatchObject({
      IdProducto: 1,
      IdProveedor: 1,
      Precio: expect.stringMatching(/^\d+\.\d{2}$/),
    });
  });

  it('profile GET returns complete UsuarioResponse shape', async () => {
    const data = (await callMock('GET', `usuario/${MOCK_USER_ID}`)) as Record<
      string,
      unknown
    >;
    for (const field of USUARIO_FIELDS) {
      expect(data).toHaveProperty(field);
    }
    expect(data.Nombres).toBe('María');
    expect(data.Apellidos).toBe('Rodríguez');
    expect(data.Correo).toMatch(/@/);
  });

  it('profile PUT mutates mock user so edits persist in session', async () => {
    await callMock('PUT', `usuario/${MOCK_USER_ID}`, {
      Nombres: 'Ana',
      Apellidos: 'Pérez',
      Telefono: '8099998888',
      NombreUsuario: 'anaperez',
    });

    const after = (await callMock('GET', `usuario/${MOCK_USER_ID}`)) as {
      Nombres: string;
      Apellidos: string;
      Telefono: string;
      NombreUsuario: string;
    };
    expect(after.Nombres).toBe('Ana');
    expect(after.Apellidos).toBe('Pérez');
    expect(after.Telefono).toBe('8099998888');
    expect(after.NombreUsuario).toBe('anaperez');
  });

  it('change-password returns success message', async () => {
    const data = (await callMock('PUT', 'change-password', {
      IdUsuario: MOCK_USER_ID,
      Clave: 'oldpass',
      ClaveNueva: 'newpass1',
    })) as { message: string };
    expect(data.message).toMatch(/Contraseña/i);
  });

  it('DELETE usuario returns confirmation', async () => {
    const data = (await callMock('DELETE', `usuario/${MOCK_USER_ID}`)) as {
      message: string;
    };
    expect(data.message).toMatch(/eliminado/i);
  });

  it('GET sucursal returns branch locations', async () => {
    const data = (await callMock('GET', 'sucursal')) as Array<{ IdSucursal: number }>;
    expect(data.length).toBeGreaterThanOrEqual(10);
  });

  it('POST sucursal-cercana ranks branches with Precio', async () => {
    const data = (await callMock('POST', 'sucursal-cercana', {
      ids_productos: [1, 3],
      lista_cantidad: [1, 2],
    })) as Array<{ IdProveedor: number; Precio: number; Distancia: number }>;
    expect(data.length).toBeGreaterThanOrEqual(6);
    expect(data[0]).toMatchObject({
      IdProveedor: expect.any(Number),
      Precio: expect.any(Number),
      Distancia: expect.any(Number),
    });
  });

  it('POST ruta-multiples-listas returns route stops', async () => {
    const data = (await callMock('POST', 'ruta-multiples-listas', {
      ids_proveedores: [1, 2, 3],
    })) as Array<{ IdSucursal: number }>;
    expect(data).toHaveLength(3);
  });

  it('GET productosdelista returns items for seeded list', async () => {
    const data = (await callMock('GET', 'productosdelista/1')) as Array<{
      IdProducto: number;
      Cantidad: number;
    }>;
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0]).toHaveProperty('PrecioActual');
  });

  it('PUT lista updates IdProveedor and reprices items', async () => {
    const before = (await callMock('GET', 'productosdelista/1')) as Array<{
      IdProducto: number;
      PrecioActual: string;
    }>;
    const updated = (await callMock('PUT', 'lista/1', {
      IdProveedor: 2,
    })) as { IdLista: number; IdProveedor: number };
    expect(updated).toMatchObject({ IdLista: 1, IdProveedor: 2 });
    const after = (await callMock('GET', 'productosdelista/1')) as Array<{
      IdProducto: number;
      PrecioActual: string;
    }>;
    expect(after).toHaveLength(before.length);
    // Prices should come from matrix for provider 2
    expect(Number(after[0].PrecioActual)).toBeGreaterThan(0);
  });

  it('POST listaproducto adds item to list', async () => {
    const data = (await callMock('POST', 'listaproducto', {
      IdLista: 1,
      IdProducto: 4,
      Cantidad: 2,
      PrecioActual: '425.00',
    })) as { IdProducto: number; Cantidad: number };
    expect(data).toMatchObject({ IdProducto: 4, Cantidad: 2 });
  });

  it('POST listaproducto accepts zero price (unbound)', async () => {
    const data = (await callMock('POST', 'listaproducto', {
      IdLista: 1,
      IdProducto: 16,
      Cantidad: 1,
      PrecioActual: '0.00',
    })) as { IdProducto: number; PrecioActual: string };
    expect(data.IdProducto).toBe(16);
    // Mock may fill from list provider when PrecioActual is 0
    expect(data.PrecioActual).toBeDefined();
  });

  it('PUT listaproducto updates quantity', async () => {
    await callMock('POST', 'listaproducto', {
      IdLista: 1,
      IdProducto: 5,
      Cantidad: 1,
      PrecioActual: '12.00',
    });
    const data = (await callMock('PUT', 'listas/1/productos/5', {
      Cantidad: 3,
    })) as { IdProducto: number; Cantidad: number };
    expect(data).toMatchObject({ IdProducto: 5, Cantidad: 3 });
  });

  it('DELETE listaproducto removes item', async () => {
    await callMock('POST', 'listaproducto', {
      IdLista: 1,
      IdProducto: 6,
      Cantidad: 1,
      PrecioActual: '8.00',
    });
    const data = (await callMock('DELETE', 'listas/1/productos/6')) as {
      message: string;
    };
    expect(data.message).toMatch(/eliminado/i);
    const remaining = (await callMock('GET', 'productosdelista/1')) as {
      IdProducto: number;
    }[];
    expect(remaining.find((p) => p.IdProducto === 6)).toBeUndefined();
  });

  it('analizar-pregunta returns markdown recipe', async () => {
    const data = (await callMock('POST', 'dashboard/analizar-pregunta', {
      pregunta: 'Receta con: arroz, pollo.',
    })) as { respuesta: string };
    expect(data.respuesta).toMatch(/Ingredientes/i);
    expect(data.respuesta).toMatch(/Sancocho/i);
  });

  it('covers every API path used in app/ and core/', async () => {
    const missing: string[] = [];
    for (const route of APP_API_ROUTES) {
      const result = await callMock(route.method, route.path, route.data ?? {});
      if (!isMockImplemented(result)) {
        missing.push(`${route.method} ${route.path}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
