# ToBarato

App Expo/React Native para comparar precios y armar listas de compras en
República Dominicana (`RD$`).

## Requisitos y arranque

- Node.js `>=22.13.0`
- Yarn 1.x

```bash
cp .env.template .env
yarn install
yarn start
```

También puedes usar `yarn ios`, `yarn android`, `yarn web` o
`yarn start:dev-client`. SDK 57 requiere development build en un dispositivo
físico; Expo Go de la App Store no es compatible.

## Configuración

Las variables públicas de referencia están en `.env.template`:

- `EXPO_PUBLIC_API_URL`: base URL, centralizada en `src/shared/config/env.ts`.
- `EXPO_PUBLIC_SENTRY_DSN` y `EXPO_PUBLIC_SENTRY_ENVIRONMENT`: Sentry
  opcional; configura valores sensibles fuera del repositorio.

Los paths relativos viven en `src/shared/api/endpoints.ts`. No inventes rutas,
secretos ni credenciales.

## Validación rápida

```bash
yarn typecheck
yarn lint
yarn test --ci --runInBand --passWithNoTests
yarn prettier --check README.md 'docs/**/*.md'
yarn prettier --check --parser markdown .cursor/rules/tobarato-project.mdc
git diff --check
```

## Documentación

- [Índice y guía rápida](docs/README.md)
- [Proyecto y alcance](docs/PROJECT.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [API y DTOs](docs/API.md)
- [Flujos actuales](docs/FLOWS.md)
- [Calidad y release](docs/QUALITY.md)
- [Contribución y nuevos flujos](docs/CONTRIBUTING.md)
- [Deuda y asuntos conocidos](docs/KNOWN_ISSUES.md)

La documentación es la fuente de contexto para cambios futuros. Consulta
especialmente `CONTRIBUTING.md` antes de agregar un flujo y `KNOWN_ISSUES.md`
antes de diagnosticar una regresión.

## Desarrollo Offline

En `__DEV__`, el login permite cambiar a Offline. El adaptador de
`src/shared/dev/` devuelve datos mock con latencia simulada y mutaciones en
memoria, sin reemplazar la API de producción ni ofrecer sincronización.

## Estructura

```text
app/                 # Rutas Expo Router y pantallas
src/features/        # Dominios, hooks, APIs, esquemas y selectores
src/shared/api       # Axios, endpoints, sesión, DTOs y React Query
src/shared/ui        # Componentes visuales reutilizables
src/shared/theme     # Tokens de diseño
src/shared/i18n      # Español y configuración de idioma
.maestro/            # Flujos E2E
```
