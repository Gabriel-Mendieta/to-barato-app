# Flujos de usuario

`Confirmado` significa que está implementado en el código actual. `Pendiente`
separa lo que solo tiene UI, mock o una integración incompleta.

## Entrada y autenticación

1. `/` renderiza `app/auth/IniciarSesion.tsx`.
2. La pantalla valida sesión almacenada mediante `GET usuario/{id}`. Si es
   válida, reemplaza la ruta por `/tabs/home`; si no, muestra login.
3. Login exige correo y contraseña no vacíos, llama `POST login`, guarda tokens
   y `usuario.id` en SecureStore y entra a `/tabs/home`.
4. Biometría comprueba hardware/registro, autentica localmente y vuelve a
   validar la sesión almacenada. Sin sesión muestra aviso.
5. Registro en `/auth/RegisterScreen` valida nombre, email y contraseña con
   Zod, llama `POST solicitar-otp` y navega con los datos del formulario
   codificados a `/auth/Otp`.
6. OTP usa seis dígitos, avance automático, pegado, borrado, contador de 60
   segundos y reenvío. `POST verificar-otp` exitoso lleva a
   `/auth/Profile-setup`.
7. Profile setup valida teléfono, fecha no futura y foto, arma `SignUpRequest`
   y llama `POST signup`; éxito entra a home.

Estados: login/registro/OTP/perfil muestran loading en botones, errores por
toast y/o campo. La recuperación de contraseña y Google Sign-In están
`Pendientes` y solo muestran “Próximamente”. El código OTP se conserva como
parámetro, pero el payload visible de signup no lo envía: confirmar ese
contrato antes de declarar el registro productivo.

## Inicio

Ruta `/tabs/home` (`app/tabs/home/index.tsx`):

- consulta proveedores y precios por proveedor;
- filtra supermercados conocidos para las tarjetas;
- muestra ahorro mensual, categorías, bajadas de precio, tiendas y CTA de
  receta;
- permite abrir búsqueda, mapa, detalle de producto y listas.

Loading usa skeletons. Sin ofertas muestra `EmptyState`; fallos de carga se
absorben y terminan mostrando contenido vacío, sin un mensaje explícito de
error. Ahorro mensual y sparkline son datos de diseño (`Pendiente` de fuente
real). Micrófono, notificaciones y CTA de receta no implican integración de
voz/notificaciones: micrófono y notificaciones son `Stub`.

## Listas y creación

Ruta `/tabs/lista` (`app/tabs/lista/index.tsx`):

- obtiene `user_id`/token, lista con `useLists` y conteos de items;
- presenta presupuesto, progreso, ahorro, tarjetas y empty state;
- pull-to-refresh vuelve a cargar listas y conteos;
- pulsar abre `/tabs/list/[id]`; pulsación larga permite seleccionar listas;
- el menú permite compartir, seleccionar para ruta y eliminar con confirmación;
- `Crear nueva lista` abre `CreateListModal`.

El modal consulta `GET tipoproveedor`, muestra tipos y luego valida un nombre
recortado de 1–60 caracteres. La pantalla busca un proveedor de ese tipo,
crea la lista con `POST lista` (`PrecioTotal: '0.00'`) y abre
`/tabs/list/add` con `listaId`, tipo, nombre y proveedor.

Loading usa skeletons; error permite reintentar; lista vacía ofrece creación.
La eliminación es optimista y revierte si falla. El progreso “comprados” es
`estimateDone` determinista de diseño, no un estado remoto (`Pendiente`).

## Añadir productos

Ruta `/tabs/list/add` (`app/tabs/list/add.tsx`):

- carga catálogo por tipo (`GET productotipoproveedor/{tipoId}`), categorías y
  unidades;
- modo browse muestra populares y hasta ocho categorías;
- texto filtra por nombre; una categoría filtra por `IdCategoria`;
- tocar producto abre bottom sheet de cantidad, mínimo 1;
- confirma `POST listaproducto` con `PrecioActual: '0.00'`, lista, producto y
  cantidad;
- botón inferior vuelve al detalle de lista.

La pantalla tiene skeleton, error con reintento y empty state. La selección de
“Ofertas” es un filtro textual, no una categoría backend garantizada.

## Flujo auxiliar de selección de sucursal

`/tabs/list/providers` (`app/tabs/list/providers.tsx`) está registrado como
ruta auxiliar pero no tiene una llamada `router.push` desde las pantallas
actuales. Si recibe `items` codificados, valida productos, solicita ubicación,
consulta `POST sucursal-cercana`, permite elegir sucursal, abrir navegación y
guardar una lista completa: crea `POST lista` y agrega cada producto con su
precio.

Tiene loading, error, empty, permiso de ubicación, nombre requerido y mensaje
de guardado parcial. Su estado es `Pendiente de integración/retirada`: antes de
conectarlo a una pantalla debe decidirse si reemplaza el flujo actual de
crear lista + añadir productos, porque ambos crean listas y pueden divergir en
precios, nombres y navegación.

## Detalle de lista

Ruta `/tabs/list/[id]`:

- obtiene lista, items, detalle/precios de cada producto y proveedores;
- calcula precio efectivo usando oferta cuando existe;
- permite cambiar proveedor; la mutación actualiza optimistamente la lista y
  luego invalida items/listas;
- permite marcar visualmente items, editar cantidad entera positiva y eliminar
  deslizando;
- muestra total, ahorro calculado y diferencia frente al proveedor más barato;
- abre mapa de la sucursal calculada o genera una receta/uso mediante
  `POST dashboard/analizar-pregunta`;
- receta navega a `/tabs/list/iaResult`, donde se parsea Markdown en cliente.

Sin items aparece empty state. Loading y errores tienen skeleton/reintento;
errores de mutaciones usan toast y rollback cuando aplica. La ruta de
sucursal requiere permiso de ubicación y puede quedar deshabilitada.

## Búsqueda, producto y proveedor

`/tabs/search` (`app/tabs/search/index.tsx`) carga proveedores y catálogo por
proveedor, acepta `proveedorId` inicial, filtra texto y abre
`/tabs/product/{id}`. Tiene chips de proveedor, skeleton, reintento, sin
proveedores y sin resultados.

`/tabs/product/{id}` valida el ID, consulta detalle y precios por proveedor,
muestra imagen/detalle/precio y lista comparativa. Tiene skeleton, error,
reintento, ID inválido y empty state de precios.

`/tabs/map` (`app/tabs/map/index.tsx`) solicita ubicación, carga tipos,
proveedores y sucursales, filtra por texto/tipo, descarta coordenadas inválidas,
ordena por distancia y muestra mapa/carrusel. Seleccionar una sucursal abre
bottom sheet y “Cómo llegar” abre Apple Maps en iOS o Google Navigation en
Android. Sin permiso usa Santo Domingo como región de fallback y muestra aviso;
errores y ausencia de sucursales tienen estados explícitos.

## Perfil y configuración

`/tabs/perfil` carga `GET usuario/{id}` con sesión guardada, muestra perfil y
notificaciones locales hardcodeadas. Permite:

- editar el nombre visible y teléfono en `/tabs/settings/EditProfile` con
  `PUT usuario/{id}`; el nombre visible se traduce a `Nombres`/`Apellidos` y
  el correo se presenta como solo lectura. `UrlPerfil` continúa en el DTO,
  pero el rediseño del ZIP no incluye un control de foto ni simula su
  persistencia;
- cambiar contraseña en `/tabs/settings/ChangePassword` con
  `PUT change-password`;
- cerrar sesión limpiando SecureStore;
- eliminar cuenta con confirmación y `DELETE usuario/{id}`.

Las pantallas validan campos con Zod y muestran loading/error. El email es de
solo lectura al editar. Las notificaciones reales son `Pendientes`; las
preferencias están comentadas/no disponibles.

## Comportamiento Offline

Solo en `__DEV__`, el banner de login permite Online/Offline. La preferencia se
guarda en SecureStore. Offline intercepta las mismas rutas desde
`src/shared/dev/mockRouter.ts`, simula 300–800 ms y mantiene mutaciones de
listas/perfil en memoria. Las credenciales son ficticias y cualquier login
funciona. No hay sincronización ni persistencia offline de producción.
