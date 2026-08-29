import { z } from 'zod';
import { passwordSchema } from '@/src/features/auth/schema';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
