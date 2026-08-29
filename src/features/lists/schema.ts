import { z } from 'zod';

export const createListSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre de la lista es obligatorio.')
    .max(60, 'El nombre no puede superar 60 caracteres.'),
});

export type CreateListFormValues = z.infer<typeof createListSchema>;
