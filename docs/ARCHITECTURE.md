# Arquitectura

## Organización feature-based

`app/` contiene pantallas y rutas Expo Router. La lógica reusable se separa en
`src/features/<dominio>/`:

- `auth`: API, sesión, hooks y esquemas de login/registro.
- `lists`: API, hooks, esquema de creación y selectores de resumen.
- `products`: API, hooks y selectores de parámetros.
- `providers`: API, hooks y selectores de mapa/selección.
- `profile`: API, hooks y esquema de edición.
- `recipes`: API, hook, mock y parser de respuesta.
- `settings`: esquema de cambio de contraseña.

`src/shared/` aloja infraestructura transversal: `api`, `ui`, `theme`, `i18n`,
`monitoring`, `dev` y helpers de productos.

## Capas y flujo de datos

El flujo esperado es:

`pantalla app/ → hook de feature → función api de feature → api Axios →
endpoints relativos → backend o adapter mock`.

- Una pantalla compone UI, navegación y estado local.
- Un hook encapsula `useQuery`/`useMutation`, validación de IDs e invalidación.
- Una función de `api.ts` conoce el DTO y llama a `api`.
- `src/shared/api/client.ts` centraliza base URL, headers, Bearer, refresh,
  timeout, normalización de errores y el adapter Offline.
- `src/shared/api/endpoints.ts` es la única lista de paths.
- Los DTOs en `src/shared/api/dto/` describen el contrato observado.

No se debe llamar `axios` directamente desde una pantalla ni hardcodear la
base URL o un path nuevo en un componente.

## React Query

El `QueryClient` compartido se crea en `src/shared/api/queryClient.ts` y se
inyecta en `app/_layout.tsx`. Configuración actual:

- `staleTime`: 30 segundos; `gcTime`: 5 minutos.
- `networkMode: 'always'` para queries y mutations, necesario para que el
  adapter Offline pueda resolver peticiones.
- No refetch al enfocar ventana.
- Una repetición para errores no-4xx/5xx; errores HTTP con status menor a 500
  no se reintentan. Mutaciones: sin retry.

Keys canónicas:

- `queryKeys.user(id)`.
- `queryKeys.lists.all(userId)` y `.items(listId)`.
- `queryKeys.products.catalog`, `.detail`, `.prices`, `.byProvider`,
  `.categories`, `.units`.
- `queryKeys.providers.all`, `.byId`, `.types`, `.branches`, `.nearby`.

Las mutaciones de listas actualizan de forma optimista items/proveedor cuando
corresponde, guardan snapshot y revierten en error. Luego invalidan listas,
items y/o `providers.root`/`providers.nearby`. Al agregar una key nueva, usa el
objeto canónico y actualiza las invalidaciones relacionadas.

## Navegación

La raíz (`app/_layout.tsx`) monta fuentes, i18n, Query Client, safe areas,
gestures, bottom sheets, toasts y Stack. Los stacks de auth y raíz usan
animación lateral.

Rutas principales:

- `/auth/IniciarSesion`, `/auth/RegisterScreen`, `/auth/Otp`,
  `/auth/Profile-setup`.
- `/tabs/home`, `/tabs/lista`, `/tabs/map`, `/tabs/perfil`.
- Rutas auxiliares: `/tabs/search`, `/tabs/list/add`, `/tabs/list/[id]`,
  `/tabs/list/providers`, `/tabs/product/[id]`,
  `/tabs/list/iaResult`, `/tabs/settings/EditProfile` y
  `/tabs/settings/ChangePassword`.

La barra inferior custom (`src/shared/ui/TabBar.tsx`) expone cuatro tabs y
mantiene las rutas auxiliares fuera de la barra. Los parámetros de ruta se
validan con selectores antes de usarse.

## Diseño e internacionalización

Los tokens canónicos están en `src/shared/theme/tokens.ts`: colores claro/oscuro,
espaciado, radios, tipografía Plus Jakarta Sans, gutters, ancho máximo de
tablet y colores de proveedor/categoría. `useThemeColors` resuelve el tema
native; `tailwind.config.js` se sincroniza con el archivo generado mediante
`yarn tokens:sync`.

Componentes compartidos relevantes: `Screen`, `ScreenTitle`, `Button`, `Field`,
`EmptyState`, `Skeleton`, `CreateListModal`, `ToastProvider`, bottom sheet y
`TabBar`. Reutilízalos antes de crear variantes locales.

La configuración i18n está en `src/shared/i18n/`; el idioma inicial nativo se
detecta con `expo-localization`, con `es` como fallback. Los recursos españoles
están separados por dominio. Toda nueva cadena visible debe vivir en un locale,
no inline en una pantalla (las pantallas antiguas aún contienen algunos textos
inline; es deuda).

## Online, Offline y errores

`src/shared/dev/devMode.ts` persiste el toggle de desarrollo en SecureStore.
Cuando `__DEV__` y Offline están activos, el adapter de Axios llama a
`src/shared/dev/mockRouter.ts`, que añade 300–800 ms por defecto y devuelve
datos mutables en memoria. Las pantallas no deberían saber si la respuesta es
mock o backend.

El cliente agrega `Authorization: Bearer <access>` si no hay header explícito.
Un 401 intenta un refresh único concurrente y repite la solicitud una vez;
si falla, limpia SecureStore. `normalizeApiError` devuelve `ApiError` y elimina
tokens/contraseñas de mensajes y detalles.

Sentry nativo se habilita solo con DSN HTTPS válido y filtra PII/campos sensibles.
En web `sentry.ts` deja `sentryEnabled` en `false`. No registrar credenciales,
OTP, tokens ni respuestas privadas.

## Decisiones y anti-patrones

Decisiones vigentes:

- Axios y endpoints centralizados para que mock y backend compartan contrato.
- DTOs explícitos con decimales como `string | number`.
- Hooks de dominio como frontera de cache e invalidación.
- Selectores puros para parseo, filtros, distancias y resúmenes comprobables.
- Fallback web separado para componentes nativos.

Prohibido:

- Inventar endpoints, nombres de campos o respuestas no verificadas.
- Crear un segundo cliente HTTP o duplicar la base URL.
- Mutar cache sin snapshot/reversión cuando la UI es optimista.
- Hacer llamadas de red en render o hooks dentro de loops.
- Usar datos mock, ahorros estimados o “comprados” como métricas reales.
- Poner secretos, tokens, DSN privado o credenciales en código/documentación.
