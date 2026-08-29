import { z } from 'zod';
export const editProfileSchema = z.object({
  nombreUsuario: z.string().trim().min(3, 'profile.usernameMin'),
  correo: z.string().trim().min(1, 'profile.emailRequired').email('profile.emailInvalid'),
  telefono: z.string().trim().min(7, 'profile.phoneInvalid'),
  nombres: z.string().trim().min(1, 'profile.nameRequired'),
  apellidos: z.string().trim().min(1, 'profile.surnameRequired'),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;
