import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { mockDelay } from './mockDelay';
import {
  handleChangePassword,
  handleDeleteUsuario,
  handleGetUsuario,
  handleLogin,
  handleProductoProveedor,
  handlePutUsuario,
  handleRefresh,
  handleSignup,
  handleSolicitarOtp,
  handleVerificarOtp,
} from './mocks/auth.mock';
import { handleGetCategorias } from './mocks/home.mock';
import {
  handleDeleteLista,
  handleDeleteListaProducto,
  handleGetListaProducto,
  handleGetListas,
  handleGetProductosDeLista,
  handlePostLista,
  handlePostListaProducto,
  handlePutLista,
  handlePutListaProducto,
  handleRutaMultiplesListas,
  handleSucursalCercana,
} from './mocks/lists.mock';
import {
  handleGetPreciosProductos,
  handleGetPreciosProductosProveedor,
  handleGetProductoById,
  handleGetProductos,
  handleGetProductosTipoProveedor,
} from './mocks/products.mock';
import {
  handleGetProveedorById,
  handleGetProveedores,
  handleGetSucursales,
  handleGetTiposProveedor,
  handleGetUnidadMedida,
} from './mocks/providers.mock';
import { handleAnalizarPregunta } from './mocks/recipes.mock';

export type MockContext = {
  method: string;
  path: string;
  params: Record<string, string>;
  data: unknown;
};

function parseBody(data: unknown): Record<string, unknown> {
  if (data == null) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof data === 'object') return data as Record<string, unknown>;
  return {};
}

export function normalizePath(config: InternalAxiosRequestConfig): string {
  let url = config.url ?? '';
  const base = config.baseURL ?? '';
  if (base && url.startsWith(base)) {
    url = url.slice(base.length);
  }
  const [pathPart] = url.split('?');
  return pathPart.replace(/^\/+|\/+$/g, '');
}

export function buildMockContext(
  config: InternalAxiosRequestConfig
): MockContext {
  const path = normalizePath(config);
  const params: Record<string, string> = {};

  const qs = (config.url ?? '').includes('?')
    ? (config.url ?? '').split('?')[1]
    : '';
  if (qs) {
    qs.split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    });
  }
  if (config.params && typeof config.params === 'object') {
    Object.entries(config.params).forEach(([k, v]) => {
      if (v != null) params[k] = String(v);
    });
  }

  return {
    method: (config.method ?? 'get').toUpperCase(),
    path,
    params,
    data: parseBody(config.data),
  };
}

function matchSegment(path: string, pattern: string): Record<string, string> | null {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    const pv = pathParts[i];
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = pv;
    } else if (pp !== pv) {
      return null;
    }
  }
  return params;
}

export async function routeMock(ctx: MockContext): Promise<unknown> {
  const { method, path, params } = ctx;
  const data = ctx.data as Record<string, unknown>;

  // Auth
  if (method === 'POST' && path === 'login') return handleLogin(data);
  if (method === 'GET' && path === 'refresh_token') return handleRefresh();
  // Legacy alias kept only for existing offline callers.
  if (method === 'POST' && path === 'refresh') return handleRefresh();
  if (method === 'POST' && path === 'solicitar-otp') return handleSolicitarOtp();
  if (method === 'POST' && path === 'verificar-otp') {
    return handleVerificarOtp();
  }
  if (method === 'POST' && path === 'signup') return handleSignup();
  if (method === 'PUT' && path === 'change-password') return handleChangePassword();

  let seg = matchSegment(path, 'usuario/:id');
  if (seg) {
    const id = Number(seg.id);
    if (method === 'GET') return handleGetUsuario(id);
    if (method === 'PUT') return handlePutUsuario(id, data);
    if (method === 'DELETE') return handleDeleteUsuario();
  }

  // Providers / map
  if (method === 'GET' && path === 'tipoproveedor') return handleGetTiposProveedor();
  if (method === 'GET' && path === 'proveedor') return handleGetProveedores();
  seg = matchSegment(path, 'proveedor/:id');
  if (method === 'GET' && seg) return handleGetProveedorById(Number(seg.id));
  if (method === 'GET' && path === 'sucursal') return handleGetSucursales();
  if (method === 'GET' && path === 'categoria') return handleGetCategorias();
  if (method === 'GET' && path === 'unidadmedida') return handleGetUnidadMedida();

  if (method === 'POST' && path === 'sucursal-cercana') return handleSucursalCercana(data);
  if (method === 'POST' && path === 'ruta-multiples-listas') {
    return handleRutaMultiplesListas(data);
  }

  // Products
  if (method === 'GET' && path === 'producto') return handleGetProductos();
  seg = matchSegment(path, 'producto/:id');
  if (method === 'GET' && seg) return handleGetProductoById(Number(seg.id));

  seg = matchSegment(path, 'productotipoproveedor/:tipoId');
  if (method === 'GET' && seg) {
    return handleGetProductosTipoProveedor(Number(seg.tipoId));
  }

  seg = matchSegment(path, 'precios-productos/:productoId');
  if (method === 'GET' && seg && !path.includes('/proveedor/')) {
    return handleGetPreciosProductos(Number(seg.productoId));
  }

  seg = matchSegment(path, 'precios-productos/proveedor/:proveedorId');
  if (method === 'GET' && seg) {
    return handleGetPreciosProductosProveedor(Number(seg.proveedorId));
  }

  seg = matchSegment(path, 'productos/:productoId/proveedores/:proveedorId');
  if (method === 'GET' && seg) {
    return handleProductoProveedor(Number(seg.productoId), Number(seg.proveedorId));
  }

  // Lists
  if (method === 'GET' && path === 'lista') return handleGetListas();
  if (method === 'POST' && path === 'lista') return handlePostLista(data);
  seg = matchSegment(path, 'lista/:id');
  if (seg) {
    if (method === 'PUT' || method === 'PATCH') {
      return handlePutLista(Number(seg.id), data);
    }
    if (method === 'DELETE') return handleDeleteLista(Number(seg.id));
  }

  seg = matchSegment(path, 'productosdelista/:idLista');
  if (method === 'GET' && seg) return handleGetProductosDeLista(Number(seg.idLista));

  if (method === 'POST' && path === 'listaproducto') return handlePostListaProducto(data);

  seg = matchSegment(path, 'listaproducto/:idLista/:idProducto');
  if (seg) {
    const idLista = Number(seg.idLista);
    const idProducto = Number(seg.idProducto);
    if (method === 'PUT' || method === 'PATCH') {
      return handlePutListaProducto(idLista, idProducto, data);
    }
    if (method === 'DELETE') {
      return handleDeleteListaProducto(idLista, idProducto);
    }
  }

  seg = matchSegment(path, 'listas/:idLista/productos/:idProducto');
  if (seg) {
    const idLista = Number(seg.idLista);
    const idProducto = Number(seg.idProducto);
    if (method === 'GET') {
      return handleGetListaProducto(idLista, idProducto);
    }
    if (method === 'PUT' || method === 'PATCH') {
      return handlePutListaProducto(idLista, idProducto, data);
    }
    if (method === 'DELETE') {
      return handleDeleteListaProducto(idLista, idProducto);
    }
  }

  // Recipes / IA
  if (method === 'POST' && path === 'dashboard/analizar-pregunta') {
    return handleAnalizarPregunta(data);
  }

  console.warn(`[dev/mockRouter] Sin mock para ${method} ${path}`, params);
  return { message: `Mock no implementado: ${method} ${path}` };
}

export async function resolveMockRequest(
  config: InternalAxiosRequestConfig
): Promise<AxiosResponse> {
  await mockDelay();
  const ctx = buildMockContext(config);
  const responseData = await routeMock(ctx);
  return {
    data: responseData,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config,
  };
}
