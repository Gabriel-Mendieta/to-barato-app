import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'El correo electrónico es obligatorio.')
  .email('Ingresa un correo electrónico válido.');

export const passwordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres.')
  .regex(/[A-Z]/, 'Incluye al menos una mayúscula.')
  .regex(/\d/, 'Incluye al menos un número.')
  .regex(/[^A-Za-z0-9]/, 'Incluye al menos un carácter especial.');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const profileSetupSchema = z.object({
  phone: z.string().trim().min(7, 'Ingresa un teléfono válido (mínimo 7 caracteres).'),
  dob: z.date().max(new Date(), 'La fecha no puede ser futura.'),
  photoUri: z.string().min(1, 'Selecciona una foto de perfil.'),
});

export type ProfileSetupFormValues = z.infer<typeof profileSetupSchema>;
