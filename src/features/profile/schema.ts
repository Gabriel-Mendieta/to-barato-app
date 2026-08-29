import { z } from 'zod';
import { emailSchema } from '@/src/features/auth/schema';

export const editProfileSchema = z.object({
  nombreUsuario: z.string().trim().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.'),
  correo: emailSchema,
  telefono: z.string().trim().min(7, 'Ingresa un teléfono válido (mínimo 7 caracteres).'),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios.'),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios.'),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;
