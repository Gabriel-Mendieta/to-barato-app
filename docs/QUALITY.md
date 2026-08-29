# Calidad y validación

## Comandos exactos

Ejecuta desde la raíz:

```bash
yarn typecheck
yarn lint
yarn test --ci --runInBand --passWithNoTests
yarn prettier --check README.md 'docs/**/*.md'
yarn prettier --check --parser markdown .cursor/rules/tobarato-project.mdc
git diff --check
```

Para aplicar formato solo a documentación, si es necesario:

```bash
yarn prettier --write README.md 'docs/**/*.md' '.cursor/rules/**/*.mdc'
```

El script `yarn format` modifica todo el repositorio y no debe usarse para una
revisión documental. `yarn tokens:sync` solo se usa después de cambiar
`src/shared/theme/tokens.ts`.

## Pruebas

La suite Jest usa `jest-expo`, RNTL y `jest.setup.ts`. Las pruebas actuales
cubren:

- API/configuración, errores normalizados, cliente y Query Client.
- APIs y hooks de listas, productos y proveedores.
- validación Zod de auth, perfil, contraseña y creación de listas.
- selectores de parámetros, listas, mapa y single-flight.
- router/mocks offline, datos seed, parser de receta y haptics.

Los tres recorridos E2E declarados son:

```bash
maestro test .maestro/login.yaml
maestro test .maestro/create-list.yaml
maestro test .maestro/compare-and-navigate.yaml
```

Requieren Maestro instalado y un development build con
`com.gabrielmendieta.tobaratoapp`. Usan Offline, datos dummy y permisos
interactivos; no se consideran una ejecución CI automática.

## Criterios de aceptación

- `yarn typecheck` termina sin errores.
- `yarn lint` no agrega errores ni warnings nuevos sin justificar.
- Las pruebas de contrato y del flujo afectado pasan.
- La nueva pantalla conserva loading, error, empty y estados de mutación.
- IDs, cantidades, fechas, coordenadas y formularios se validan antes de
  llamar a la API.
- Las keys e invalidaciones de React Query se mantienen coherentes.
- Online y Offline ejercitan la misma función de feature y DTO.
- iOS, Android y web se revisan cuando el cambio toca UI compartida,
  navegación o APIs nativas.
- No se agregan secretos, endpoints sin confirmar ni strings visibles fuera de
  i18n.
- Los tres impactos (funcional, contrato y plataforma) quedan documentados.

## Matriz mínima Offline/Online

- Login: credenciales reales contra backend; cualquier credencial con mock.
- Catálogo/productos/proveedores: respuesta API real; datos seed y latencia
  simulada con mock.
- Crear/editar/eliminar lista e item: persistencia backend; mutación en memoria
  y reinicio de datos con mocks.
- Ubicación/mapa: permisos y navegación externa en dispositivo; coordenadas
  seed en Offline.
- Perfil/auth: tokens y errores reales; usuario/tokens ficticios en Offline.
- IA: respuesta del endpoint; Markdown fijo del mock y parser cliente.
- Error de red/302: comprobar mensaje seguro, no asumir JSON y verificar que no
  se expongan credenciales.

## Checklist antes de merge/release

- [ ] Revisé [KNOWN_ISSUES.md](KNOWN_ISSUES.md) y no confundí deuda existente
      con regresión.
- [ ] Ejecuté typecheck, lint, pruebas, Prettier documental y `git diff --check`.
- [ ] Añadí/actualicé pruebas de contrato, selector, hook o E2E según riesgo.
- [ ] Probé al menos el recorrido Offline afectado y el Online si la API está
      disponible.
- [ ] Probé permisos, back, teclado, safe areas y tamaños tablet si aplica.
- [ ] Verifiqué que los enlaces de docs y rutas de archivos existan.
- [ ] Revisé diff para secretos, cambios nativos accidentales y dependencias.
- [ ] Documenté cambio de contrato, migración o breaking change y lo comuniqué.
