# Proyecto y alcance

## Propósito

ToBarato ayuda a personas en República Dominicana a explorar productos,
comparar precios por proveedor y armar listas de compras en pesos dominicanos
(`RD$`). El cliente es una app React Native basada en Expo Router; consume una
API HTTP o, solo en development, un adaptador offline local.

## Alcance confirmado

- Inicio con ofertas, proveedores y acceso a búsqueda.
- Registro por correo con solicitud/verificación OTP y configuración de perfil.
- Inicio de sesión, persistencia de sesión y biometría si el dispositivo la
  soporta.
- Listas: creación por tipo de proveedor, productos, cantidades, cambio de
  proveedor, borrado, compartir y generación de rutas.
- Catálogo por proveedor, detalle de producto y comparación de precios.
- Mapa de sucursales con filtros, ubicación, selección y navegación externa.
- Perfil, edición de datos, cambio de contraseña, cierre y eliminación de cuenta.
- Generación de respuesta de IA/receta desde los productos de una lista.

## Plataformas

- iOS y iPad: `ios/`, `supportsTablet: true`, layouts adaptativos.
- Android: `android/` existe localmente, permisos de ubicación y navegación
  nativa.
- Web: salida estática Metro (`app.json`); hay fallbacks web para bottom sheet,
  mapa/funciones nativas no equivalentes.

La configuración declarativa está en `app.json`; el proyecto también contiene
carpetas nativas generadas. Esta convivencia es una observación importante para
EAS y está registrada en [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## Usuarios y escenarios

- Usuario sin sesión: inicia sesión o registra una cuenta.
- Usuario registrado: consulta precios, crea y mantiene listas.
- Usuario con ubicación autorizada: busca sucursales cercanas y abre mapas.
- Usuario en desarrollo: cambia entre Online y Offline desde login para probar
  la UI con datos mock.

## Estado actual

El código está en una fase funcional de prototipo avanzado: los recorridos
principales están conectados a funciones de dominio y tienen cobertura de
pruebas unitarias/hooks/selectores/mocks. La cobertura E2E está representada
por tres archivos Maestro, pero no se asume que se ejecuten en CI.

La API externa no está verificada como operativa: durante esta revisión devolvió
HTTP 302 para `/api/` y `/api/proveedor`, redirigiendo cada URL a sí misma.
Por eso el modo Offline es el camino reproducible para desarrollo.

## Límites explícitos

- Google Sign-In, recuperación de contraseña, búsqueda por voz y notificaciones
  reales son stubs o avisos de “próximamente”.
- Ahorro mensual del inicio y progreso/“comprados” de listas usan valores o
  estimaciones de diseño, no datos reales del backend.
- No hay persistencia offline de listas remotas ni cola de sincronización:
  Offline sustituye las respuestas HTTP solo en `__DEV__`.
- El detalle de perfil y algunas pantallas antiguas usan implementación local
  propia en vez de una capa visual completamente unificada.
- No se deben tratar los datos mock como datos de producción.
