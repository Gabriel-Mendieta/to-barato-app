# ToBarato

App móvil (Expo / React Native) para comparar precios y armar listas de compras en República Dominicana (RD$).

## Requisitos

- Node.js ≥ 22.13
- Yarn 1.x (`npm i -g yarn` si hace falta)

## Arranque local

```bash
cp .env.template .env
yarn install
yarn start
```

Luego abre iOS Simulator, Android Emulator o el development client. También:

```bash
yarn ios
yarn android
yarn web
```

SDK 57 no es compatible con Expo Go de la App Store. En un teléfono físico hay que usar un **development build** de EAS (no Expo Go).

## Development build (EAS)

El perfil `development` ya está en `eas.json` (`developmentClient` + distribución interna). El proyecto EAS está vinculado (`extra.eas.projectId`).

```bash
# Sesión Expo (si hace falta)
npx eas-cli login

# iOS — Ad Hoc / internal: el UDID del iPhone tiene que estar registrado
npx eas-cli device:create
npx eas-cli build --profile development --platform ios

# Android — APK interno, suele ser más simple (sin UDID)
npx eas-cli build --profile development --platform android
```

Cuando el build termine, instala desde el enlace de Expo (email / dashboard). En iOS: Settings → General → VPN & Device Management → confiar en el certificado del desarrollador.

Después, en la misma red Wi‑Fi que el Mac:

```bash
yarn start:dev-client
```

Escanea el QR **con el cliente ToBarato** (app instalada), no con la cámara de Expo Go.

## Variables de entorno

| Variable                         | Descripción                                    | Default                                 |
| -------------------------------- | ---------------------------------------------- | --------------------------------------- |
| `EXPO_PUBLIC_API_URL`            | Base URL de la API (con `/` final)             | `https://tobaratoapi.alirizvi.dev/api/` |
| `EXPO_PUBLIC_SENTRY_DSN`         | DSN opcional de Sentry para staging/producción | vacío                                   |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | Entorno reportado a Sentry                     | vacío                                   |

La base URL vive en un solo lugar: `src/shared/config/env.ts`.
Los paths relativos están en `src/shared/api/endpoints.ts`.
El cliente HTTP único (axios + interceptors Bearer / refresh) está en `src/shared/api/client.ts`.

**No inventes rutas nuevas en el backend**: solo cambia `EXPO_PUBLIC_API_URL` si el host cambia.

### Idiomas

La configuración central vive en `src/shared/i18n/`. El idioma inicial se detecta desde el
dispositivo y usa español (`es`) como fallback. Los recursos están organizados por dominio y no
generan llamadas de red. Para agregar otro idioma, añade su árbol de recursos y regístralo en
`src/shared/i18n/index.ts`.

### Sentry (opcional)

Sentry solo se inicializa cuando `EXPO_PUBLIC_SENTRY_DSN` contiene una URL HTTPS válida. En local y
modo offline puede permanecer vacío; no se envían eventos inesperados. La configuración desactiva
PII por defecto y filtra campos sensibles como tokens, contraseñas, códigos OTP y credenciales.

Configura el DSN fuera del repositorio (por ejemplo, variables de entorno del perfil EAS de
staging/producción) y crea un nuevo build nativo después de cambiar el app config:

```bash
npx expo prebuild
npx expo run:ios # o npx expo run:android
```

El plugin oficial `@sentry/react-native` ya está declarado en `app.json`. No pongas DSN, tokens de
auth ni credenciales en `.env` versionado. `Sentry.wrap` captura errores del árbol de Expo Router;
la instrumentación avanzada de navegación puede habilitarse posteriormente si el proyecto necesita
trazas de navegación.

### Maestro E2E

Los flujos están en `.maestro/` y no agregan Maestro a `package.json`. Instala Maestro siguiendo
su documentación oficial y ejecuta los YAML contra un development build de la app:

```bash
maestro test .maestro/login.yaml
maestro test .maestro/create-list.yaml
maestro test .maestro/compare-and-navigate.yaml
```

Los flujos usan el modo **Offline** disponible únicamente en builds de desarrollo y credenciales
dummy. No se ejecutaron automáticamente en este entorno si Maestro no está instalado.

## Plataformas

- iOS / iPad (`supportsTablet: true`) — layouts adaptativos por ancho
- Android — safe areas + back del sistema
- Web (Expo) — útil para smoke UI

## Scripts

| Script                  | Qué hace                                      |
| ----------------------- | --------------------------------------------- |
| `yarn start`            | Metro / Expo                                  |
| `yarn start:dev-client` | Metro para el development client (no Expo Go) |
| `yarn lint`             | ESLint Expo                                   |
| `yarn typecheck`        | `tsc --noEmit`                                |
| `yarn test`             | Jest + RNTL                                   |

## Arquitectura (resumen)

```
app/                 # Rutas Expo Router (composers)
src/shared/api       # Cliente HTTP + endpoints + sesión
src/shared/theme     # Tokens del design system
src/shared/ui        # Button, Chip, Field, Screen, TabBar
src/features/*       # Dominio por feature (auth, recipes, …)
```

## Notas de revival

- La API externa puede estar caída; la app sigue compilando con HTTP centralizado.
- Google Sign-In, micrófono y ahorro mensual son stubs de UI sin API falsa.
- Refresh token: el cliente intenta `POST refresh` si el access expira; si el backend no lo expone, limpia sesión.

## Modo desarrollo offline

Solo en builds de desarrollo (`__DEV__`). Permite probar flujos completos de UI sin API real.

1. En la pantalla de login aparece un banner **Modo desarrollo: Online | Offline**.
2. **Offline**: cualquier credencial funciona; datos mock (Nacional, Jumbo, La Sirena, RD$) con latencia simulada (300–800 ms).
3. **Online**: comportamiento normal vía `EXPO_PUBLIC_API_URL`.

La preferencia se guarda en SecureStore y se carga al arrancar (`initDevMode` en `app/_layout.tsx`).

El enrutamiento mock vive en `src/shared/dev/` e intercepta peticiones en `src/shared/api/client.ts` (adapter axios). Las pantallas no conocen el modo offline.

### Cómo quitarlo

1. Eliminar la carpeta `src/shared/dev/`.
2. Quitar el toggle en `app/auth/IniciarSesion.tsx`.
3. Quitar `initDevMode()` de `app/_layout.tsx`.
4. Restaurar el adapter por defecto en `src/shared/api/client.ts` (quitar imports de `../dev` y `createDevAwareAdapter`).
