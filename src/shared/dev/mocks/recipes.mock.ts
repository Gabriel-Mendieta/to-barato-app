export function handleAnalizarPregunta(body: Record<string, unknown>) {
  const pregunta = String(body.pregunta ?? '');
  const ingredientes = pregunta.match(/: (.+)\./)?.[1] ?? 'arroz, pollo, plátano';

  return {
    respuesta: `# Sancocho dominicano (mock)

## Ingredientes
- 2 lb de pollo
- 1 lb de yuca
- 2 plátanos verdes
- ${ingredientes}

## Pasos
1. Sofreír el pollo con ajo, cebolla y orégano.
2. Agregar agua, yuca y plátanos; cocinar 25 minutos.
3. Ajustar sal y servir caliente con arroz blanco.

*Respuesta generada en modo offline — sin llamada real a IA.*`,
  };
}
