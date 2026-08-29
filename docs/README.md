# Documentación de ToBarato

ToBarato es una app Expo/React Native para comparar precios en República Dominicana
(`RD$`) y construir listas de compras.

## Ruta rápida

1. Lee [PROJECT.md](PROJECT.md) para alcance, plataformas y límites.
2. Lee [ARCHITECTURE.md](ARCHITECTURE.md) antes de tocar una feature.
3. Consulta [API.md](API.md) antes de modificar una llamada o DTO.
4. Revisa [FLOWS.md](FLOWS.md) para los recorridos de usuario confirmados.
5. Aplica [QUALITY.md](QUALITY.md) para validar cambios.
6. Sigue [CONTRIBUTING.md](CONTRIBUTING.md) para un flujo nuevo.
7. Comprueba [KNOWN_ISSUES.md](KNOWN_ISSUES.md) antes de atribuir un fallo a código
   nuevo.

## Arranque mínimo

Requisitos: Node.js `>=22.13.0` y Yarn 1.x.

```bash
cp .env.template .env
yarn install
yarn start
```

Comandos de plataforma:

```bash
yarn ios
yarn android
yarn web
yarn start:dev-client
```

SDK 57 requiere development build en un dispositivo físico; Expo Go de la App
Store no es compatible con este proyecto.

## Mapa del repositorio

- `app/`: rutas y composición de pantallas con Expo Router.
- `src/features/`: APIs, hooks, esquemas y selectores por dominio.
- `src/shared/api/`: cliente Axios, endpoints, sesión, DTOs y React Query.
- `src/shared/dev/`: modo offline de desarrollo y mocks.
- `src/shared/ui/`: componentes reutilizables y estados visuales.
- `src/shared/theme/`: tokens de diseño y colores por tema.
- `src/shared/i18n/`: recursos y configuración de español.
- `.maestro/`: recorridos E2E manuales/automatizados.

## Fuente de verdad

La base URL se configura únicamente en `src/shared/config/env.ts`; las rutas
relativas viven en `src/shared/api/endpoints.ts`. No agregues endpoints,
secretos ni comportamiento backend que no esté confirmado.

Esta documentación describe el estado observado del código. Los textos
marcados como `Pendiente`, `Stub`, `Deuda` o `Riesgo` no son funcionalidades
terminadas.
