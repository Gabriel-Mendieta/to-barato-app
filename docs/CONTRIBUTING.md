# Contribuir y agregar flujos

## Procedimiento obligatorio para un flujo nuevo

1. Consulta [PROJECT.md](PROJECT.md), [ARCHITECTURE.md](ARCHITECTURE.md),
   [API.md](API.md), [FLOWS.md](FLOWS.md) y [KNOWN_ISSUES.md](KNOWN_ISSUES.md).
2. Localiza la ruta en `app/`, la feature afectada, el hook, el DTO, la query
   key, las invalidaciones, los mocks y las pruebas existentes.
3. Escribe un plan pequeño que enumere archivos, estados UI, contrato API,
   plataformas y regresiones posibles antes de editar.
4. Verifica el contrato real: método, path, auth, parámetros, respuesta,
   errores, 302 y comportamiento de backend. Si no está confirmado, detén la
   implementación y solicita aclaración.
5. Reutiliza hooks, DTOs, `src/shared/api/client.ts`, tokens de
   `src/shared/theme/tokens.ts`, componentes UI e i18n. No dupliques
   infraestructura.
6. Implementa loading, error, empty, offline/online, permisos y estados de
   mutación; valida inputs con esquemas/guards apropiados.
7. Agrega pruebas unitarias o de selector, hook/API y mock. Añade o actualiza
   Maestro para un recorrido de usuario cuando el cambio sea E2E.
8. Revisa iOS, Android, iPad y web si el flujo toca rutas, safe area, permisos,
   bottom sheets, mapa, imágenes o componentes nativos.
9. Ejecuta las validaciones de [QUALITY.md](QUALITY.md), revisa el diff y
   compara contra la matriz Offline/Online.
10. Actualiza esta documentación: flujo confirmado, contrato, deuda,
    workaround y condición de cierre. Reporta el resultado y riesgos antes de
    pedir merge.

## Evaluación de riesgo requerida

Incluye este bloque en el plan o en la descripción del cambio:

```text
Impacto:
- Usuarios, pantallas, rutas y datos afectados.
- APIs, DTOs, query keys, cache o permisos afectados.

Riesgo:
- Qué puede romperse y severidad (alta/media/baja).
- Qué supuestos no están confirmados.

Compatibilidad:
- Backend anterior/nuevo, migración requerida y comportamiento Offline.
- iOS, Android, iPad y web.

Validación:
- Pruebas agregadas y comandos ejecutados.
- Recorridos Maestro y matriz Online/Offline.

Comunicación:
- Breaking change: sí/no.
- Usuario/equipo que debe aprobarlo, aviso y workaround.
```

## Breaking changes

Antes de modificar un path, método, nombre de campo, forma de token, DTO,
query key, navegación pública o comportamiento de sesión:

- marca `Breaking change: sí` en la evaluación;
- explica el impacto, versión/fecha, migración y rollback;
- notifica al usuario antes de implementar y espera su decisión si existen
  alternativas incompatibles;
- actualiza backend, cliente, mock, pruebas y documentación de forma coordinada;
- verifica respuestas 2xx, 401, 4xx, 5xx y 302, sin ocultar un fallo cambiando
  solo el mock;
- no elimines un contrato antiguo hasta que la migración esté validada.

Un cambio que solo agrega UI debe confirmar que no altera rutas, keys,
contratos, accesibilidad ni comportamiento en Offline. Si descubre una deuda
existente, regístrala en `KNOWN_ISSUES.md` en vez de presentarla como resuelta.

## Reglas de seguridad y mantenimiento

- No escribas secretos, tokens, DSN privados ni credenciales en código, logs,
  fixtures o docs.
- Mantén la base URL en `src/shared/config/env.ts` y paths en
  `src/shared/api/endpoints.ts`.
- Usa `ApiError`/`getApiErrorMessage` y no muestres payloads sin sanitizar.
- Mantén las pantallas independientes del adapter mock.
- No hagas commit ni push como parte de una tarea de implementación salvo
  solicitud explícita.
