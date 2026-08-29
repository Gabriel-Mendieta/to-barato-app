import {
  MOCK_USER_ID,
  getPrecioProductoProveedor,
  getProductoById,
  getProveedorById,
} from './data';

export const MOCK_ACCESS_TOKEN = 'dev-mock-access-token';
export const MOCK_REFRESH_TOKEN = 'dev-mock-refresh-token';

let mockUser = {
  IdTipoUsuario: 1,
  NombreUsuario: 'mariard',
  Correo: 'maria.rodriguez@tobarato.do',
  Telefono: '8095551234',
  Clave: '********',
  Nombres: 'María',
  Apellidos: 'Rodríguez',
  Estado: true,
  UrlPerfil: 'https://i.pravatar.cc/150?u=tobarato-dev',
  FechaNacimiento: '1992-03-18',
  IdUsuario: MOCK_USER_ID,
  FechaCreacion: '2024-01-01T00:00:00Z',
};

export function handleLogin(body: Record<string, unknown>) {
  const email = String(body.Correo ?? body.email ?? 'dev@tobarato.do');
  mockUser = { ...mockUser, Correo: email };
  return {
    message: 'Login exitoso (modo offline)',
    tokens: {
      access_token: MOCK_ACCESS_TOKEN,
      refresh_token: MOCK_REFRESH_TOKEN,
      token_type: 'Bearer',
    },
    usuario: {
      id: MOCK_USER_ID,
      email,
      nombre: `${mockUser.Nombres} ${mockUser.Apellidos}`,
    },
  };
}

export function handleRefresh() {
  return {
    access_token: MOCK_ACCESS_TOKEN,
    token_type: 'Bearer',
  };
}

export function handleSolicitarOtp() {
  return { message: 'OTP enviado (mock)' };
}

export function handleVerificarOtp() {
  return { message: 'OTP verificado (mock)' };
}

export function handleChangePassword() {
  return { message: 'Contraseña actualizada (mock)' };
}

export function handleGetUsuario(id: number) {
  if (id === MOCK_USER_ID) return { ...mockUser };
  return { ...mockUser, IdUsuario: id };
}

export function handlePutUsuario(id: number, body: Record<string, unknown>) {
  mockUser = { ...mockUser, ...body, IdUsuario: id };
  return { ...mockUser };
}

export function handleDeleteUsuario() {
  return { message: 'Usuario eliminado (mock)' };
}

export function handleSignup() {
  return { message: 'Registro exitoso (mock)', IdUsuario: MOCK_USER_ID };
}

export function handleProductoProveedor(productoId: number, proveedorId: number) {
  const producto = getProductoById(productoId);
  const proveedor = getProveedorById(proveedorId);
  if (!producto || !proveedor) return null;
  const { Precio, PrecioOferta } = getPrecioProductoProveedor(
    productoId,
    proveedorId
  );
  return {
    IdProducto: productoId,
    IdProveedor: proveedorId,
    Precio,
    PrecioOferta,
  };
}

export function __resetAuthMockForTests() {
  mockUser = {
    IdTipoUsuario: 1,
    NombreUsuario: 'mariard',
    Correo: 'maria.rodriguez@tobarato.do',
    Telefono: '8095551234',
    Clave: '********',
    Nombres: 'María',
    Apellidos: 'Rodríguez',
    Estado: true,
    UrlPerfil: 'https://i.pravatar.cc/150?u=tobarato-dev',
    FechaNacimiento: '1992-03-18',
    IdUsuario: MOCK_USER_ID,
    FechaCreacion: '2024-01-01T00:00:00Z',
  };
}
