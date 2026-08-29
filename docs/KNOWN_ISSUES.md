# Deuda y asuntos conocidos

Estos puntos fueron comprobados contra el código o comandos ejecutados el
29-08-2026. `Pendiente` no significa que el problema esté resuelto.

## Pendientes técnicos

### API devuelve 302 autorreferente — severidad alta

- **Impacto:** Online no tiene un contrato HTTP verificable; `GET /api/` y
  `GET /api/proveedor` devolvieron 302 y `Location` igual a la URL solicitada.
  Las pantallas pueden quedar en error, vacío o limpiar la sesión.
- **Workaround:** usar Offline en development para recorridos UI; confirmar con
  backend la URL, método, trailing slash, auth y respuesta JSON.
- **Cierre:** endpoints reales responden 2xx/errores JSON esperados sin
  redirección autorreferente y se prueba login, catálogo, listas, perfil y
  sucursales Online.

### Configuración Expo/native incoherente — severidad media

- **Impacto:** `npx expo-doctor` detectó `splash` y `newArchEnabled` como
  propiedades adicionales según el schema instalado, y detectó carpetas
  `ios/`/`android/` junto con configuración declarativa que EAS no sincroniza
  automáticamente.
- **Workaround:** no ejecutar cambios de `app.json`, prebuild o carpetas
  nativas dentro de una tarea documental; tratar el native project existente
  como fuente efectiva hasta decidir una estrategia CNG/no-CNG.
- **Cierre:** escoger y documentar una estrategia, corregir el schema con la
  versión Expo objetivo y demostrar que `expo config`, prebuild y EAS producen
  la configuración esperada.

### Versiones patch fuera del rango esperado por Expo — severidad media

- **Impacto:** `expo-doctor` reportó 13 paquetes, incluidos Expo/RN,
  `expo-router`, `expo-location`, `expo-secure-store`, `react-native` y
  `jest-expo`, por debajo de los patches recomendados del SDK 57.
- **Workaround:** no actualizar dependencias automáticamente; coordinar una
  actualización con pruebas, lockfile y regeneración nativa.
- **Cierre:** `npx expo install --check` sin mismatches, typecheck/lint/tests,
  smoke en iOS/Android/web y revisión de `ios/Podfile.lock`/proyecto nativo.

### Iconos declarados no cuadrados — severidad baja

- **Impacto:** `expo-doctor` reportó `assets/icons/logo.png` de 123x175 usado
  como icono y foreground de adaptive icon; puede producir recorte o rechazo
  de stores/builds.
- **Workaround:** no cambiar assets durante una feature no relacionada.
- **Cierre:** entregar assets cuadrados específicos para icono y adaptive icon,
  actualizar referencias y pasar validación Expo.

### Advertencia de Sentry sin organización/proyecto — severidad baja

- **Impacto:** `expo-doctor` reportó que el plugin no tiene `organization` ni
  `project`; el build depende de variables de entorno externas. El código
  nativo solo habilita Sentry con DSN HTTPS y filtra campos sensibles.
- **Workaround:** mantener DSN y configuración fuera del repositorio; Sentry
  puede permanecer deshabilitado localmente.
- **Cierre:** configurar integración en el perfil seguro de staging/producción,
  verificar eventos sin PII y documentar el ownership.

### Warnings de lint existentes — severidad baja

- **Impacto:** `yarn lint` terminó sin errores pero reportó 18 warnings:
  entidades no escapadas, `console.log`/dependencias de effect, imports no
  usados, advertencias Axios/i18n y `set-state-in-effect`.
- **Workaround:** no convertir warnings en errores como parte de otra feature;
  el archivo `eslint.config.js` ya deja algunos patrones como warning durante
  migración.
- **Cierre:** reducir warnings por archivo, eliminar imports/logs obsoletos,
  corregir dependencias de hooks y decidir una política de cero warnings.

## Deuda funcional

### Contrato OTP/registro por confirmar — severidad alta

La pantalla verifica OTP, pero `Profile-setup` arma `SignUpRequest` sin campo
OTP visible. El backend puede validar OTP por sesión, o puede requerir el código
en signup; el repositorio no permite concluir cuál es correcto.

- **Workaround:** no declarar registro Online productivo hasta confirmar el
  contrato; usar mock solo para UI.
- **Cierre:** contrato backend documentado, prueba de éxito/error y mock
  alineados, sin pasar contraseñas/OTP por logs o navegación innecesaria.

### Funciones anunciadas como stubs — severidad media

Google Sign-In, recuperación de contraseña, voz, notificaciones reales,
preferencias y métricas reales de ahorro/progreso no están integrados. La UI
usa toast, datos fijos o estimaciones.

- **Workaround:** comunicar “próximamente”; no usar valores de diseño en
  decisiones comerciales.
- **Cierre:** endpoint/SDK y permisos confirmados, estados completos,
  persistencia, pruebas Online/Offline y eliminación de los stubs.

### Offline no sincroniza — severidad media

El mock solo funciona con `__DEV__`, usa estado en memoria y SecureStore para el
toggle. No existe cola, persistencia de listas ni resolución de conflictos.

- **Workaround:** usarlo como simulador de UI y reiniciar datos al recargar.
- **Cierre:** diseñar explícitamente persistencia/sync o retirar la promesa de
  operación offline; cubrir pérdida de red, reintentos y conflictos.

## Verificaciones que no son pendientes

- `yarn typecheck`: pasó sin errores.
- `yarn test --ci --runInBand --passWithNoTests`: 10 suites y 81 pruebas
  pasaron.
- `npx expo run:ios --device`: compilación y firma terminaron correctamente;
  quedó una advertencia de script con dependencias ambiguas, no un fallo de
  device build.
