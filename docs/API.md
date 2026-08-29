# API y contratos

## Configuración

La URL base única está en `src/shared/config/env.ts`:

`https://tobaratoapi.alirizvi.dev/api/`

`EXPO_PUBLIC_API_URL` la sobreescribe y `normalizeBaseUrl` garantiza `/` final.
El archivo de referencia es `.env.template`; `.env` es local e ignorado. No
documentes ni versionés valores sensibles.

El cliente `src/shared/api/client.ts` usa Axios con:

- `Content-Type: application/json` y `Accept: application/json`.
- Timeout de 30 segundos.
- Bearer automático desde SecureStore, salvo que la solicitud ya tenga
  `Authorization`.
- Refresh concurrente único ante 401, llamando `GET refresh_token` con el
  refresh token como Bearer; repite la solicitud original una vez.
- `normalizeApiError` para convertir fallos a `ApiError`.

## Endpoints presentes

Todos los paths son relativos a la base y están definidos en
`src/shared/api/endpoints.ts`.

Autenticación y usuario:

- `POST login`: body `LoginRequest` (`Correo`, `Clave`); devuelve
  `LoginResponse` (`tokens`, `usuario`). `persistLoginSession` guarda
  `access_token`, `refresh_token` y `usuario.id`.
- `POST signup`: body `SignUpRequest`; devuelve `SignUpResponse`.
- `POST solicitar-otp`: query `email`; devuelve `MessageResponse`.
- `POST verificar-otp`: query `email`, `codigo`; devuelve `MessageResponse`.
- `GET refresh_token`: Bearer refresh; acepta `RefreshResponse` con
  `access_token`, `token` o `tokens.access_token`.
- `PUT change-password`: body `{ IdUsuario, Clave, ClaveNueva }`;
  devuelve `MessageResponse`.
- `GET usuario/{id}`: devuelve `UserDTO`.
- `PUT usuario/{id}`: body parcial de `NombreUsuario`, `Telefono`, `Nombres`,
  `Apellidos`, `UrlPerfil`; devuelve `UserDTO`.
- `DELETE usuario/{id}`: devuelve `MessageResponse`.

Catálogo y proveedores:

- `GET tipoproveedor` → `ProviderTypeDTO[]`.
- `GET proveedor` → `ProviderDTO[]`.
- `GET proveedor/{id}` → `ProviderDTO`.
- `GET sucursal` → `BranchDTO[]`.
- `POST sucursal-cercana` → `NearbyBranchDTO[]`; body
  `NearbyBranchesRequest`.
- `POST ruta-multiples-listas` → sucursales de ruta; body
  `{ ids_proveedores: number[] }`.
- `GET categoria` → `CategoryDTO[]`.
- `GET unidadmedida` → `UnitDTO[]`.
- `GET producto` → `ProductDTO[]`.
- `GET producto/{id}` → `ProductDTO`.
- `GET productotipoproveedor/{tipoId}` → `ProductDTO[]`.
- `GET precios-productos/{productoId}` → `ProductPriceDTO[]`.
- `GET precios-productos/proveedor/{proveedorId}` →
  `ProviderCatalogProductDTO[]`.
- `GET productos/{productoId}/proveedores/{proveedorId}` → par de precio
  (`IdProducto`, `IdProveedor`, `Precio`, `PrecioOferta`); está definido para
  compatibilidad, aunque la UI actual usa principalmente los endpoints de
  precios agregados.

Listas:

- `GET lista` → `ListDTO[]`; el cliente filtra por `IdUsuario`.
- `POST lista`: body `ListCreateRequest` → `ListDTO`.
- `PUT lista/{id}`: body `ListUpdateRequest` → `ListDTO`.
- `DELETE lista/{id}` → `MessageResponse`.
- `GET productosdelista/{idLista}` → `ListItemDTO[]`.
- `POST listaproducto`: body `ListItemAddRequest` → `ListItemMutationResponse`.
- `PUT listas/{idLista}/productos/{idProducto}`: body parcial de
  `PrecioActual`/`Cantidad` → `ListItemMutationResponse`.
- `DELETE listas/{idLista}/productos/{idProducto}` → `MessageResponse`.

IA:

- `POST dashboard/analizar-pregunta`: body `{ pregunta: string }` →
  `{ respuesta?: string }`. La pantalla parsea Markdown/texto con
  `src/features/recipes/parseRecipe.ts`.

## DTOs y reglas de datos

Los tipos fuente están en `src/shared/api/dto/`:

- `auth.ts`: credenciales, tokens, OTP y mensajes.
- `user.ts`: `UserDTO` y alta de usuario.
- `catalog.ts`: productos, precios, proveedores, sucursales y
  `NearbyBranchesRequest`.
- `lists.ts`: listas, relaciones y mutaciones.
- `errors.ts`: `ApiErrorShape` y detalles sanitizados.

Los importes (`Precio`, `PrecioOferta`, `PrecioTotal`, `PrecioActual`) aceptan
`string | number`; conviértelos con `Number` y valida `Number.isFinite` antes de
calcular. IDs deben ser enteros positivos. `ids_productos` y
`lista_cantidad` deben tener igual longitud y cantidades enteras mayores que
cero. Coordenadas se validan en `providers/hooks.ts` y los selectores descartan
coordenadas fuera de rango.

## Errores, 302 y sesión

Axios no define aquí una política propia de redirecciones. La API respondió
HTTP 302 tanto para `GET /api/` como para `GET /api/proveedor` durante esta
revisión, con `Location` apuntando a la misma URL. La aplicación no debe asumir
que un 302 equivale a JSON válido: hay que verificar el endpoint real, método,
autorización y respuesta final antes de cerrar el riesgo.

Para errores con `detail`, `message`, `code` o `error_code`, el normalizador
conserva un mensaje seguro y status/code. Para errores de red devuelve
`No se pudo conectar con el servidor.`. Filtra claves arbitrarias y redacta
Bearer, tokens, contraseñas y claves. Un error 401 de una solicitud normal
intenta refresh; fallos de login o del propio refresh no se reintentan. La
validación de sesión y varias pantallas limpian SecureStore ante una sesión
inválida.

## Backend frente a mock

En Offline de development el adapter de Axios llama a
`src/shared/dev/mockRouter.ts`, no al backend. Los mocks:

- aceptan cualquier credencial en login y devuelven tokens ficticios;
- simulan OTP, cambio de contraseña, registro y operaciones de perfil;
- contienen proveedores, sucursales, 15 categorías, productos, precios y
  ofertas seed;
- mantienen listas/items en memoria y recalculan precios según proveedor;
- devuelven una receta Markdown fija para IA y una latencia de 300–800 ms;
- no representan validaciones, autenticación ni persistencia de producción.

El router mock también conserva un alias legado `POST refresh` y paths de
relación antiguos para tests; el contrato canónico de la app es
`GET refresh_token` y `listas/{id}/productos/{id}`. Si backend y mock difieren,
actualiza primero el contrato confirmado y sus pruebas, no el mock para ocultar
un fallo del backend.
