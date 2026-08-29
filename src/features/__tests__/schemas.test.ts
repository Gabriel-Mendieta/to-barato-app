import { registerSchema, profileSetupSchema } from '@/src/features/auth/schema';
import { editProfileSchema } from '@/src/features/profile/schema';
import { changePasswordSchema } from '@/src/features/settings/schema';
import { createListSchema } from '@/src/features/lists/schema';

describe('schemas de formularios', () => {
  it('valida registro y rechaza credenciales incompletas', () => {
    expect(
      registerSchema.safeParse({
        name: 'Mario Luciano',
        email: 'mario@example.com',
        password: 'Secreta1!',
      }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({
        name: '',
        email: 'correo-invalido',
        password: '123',
      }).success,
    ).toBe(false);
  });

  it('valida perfil, incluyendo foto y teléfono', () => {
    const result = profileSetupSchema.safeParse({
      phone: '8091234567',
      photoUri: 'file:///profile.jpg',
      dob: new Date(1990, 0, 1),
    });
    expect(result.success).toBe(true);
  });

  it('mantiene confirmación de contraseña como error de campo', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'Anterior1!',
      newPassword: 'Nueva123!',
      confirmPassword: 'Distinta123!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
    }
  });

  it('recorta y limita el nombre de una lista', () => {
    const result = createListSchema.parse({ nombre: '  Compras  ' });
    expect(result.nombre).toBe('Compras');
    expect(createListSchema.safeParse({ nombre: 'a'.repeat(61) }).success).toBe(false);
  });

  it('valida los campos editables del perfil', () => {
    expect(
      editProfileSchema.safeParse({
        nombreUsuario: 'mariard',
        correo: 'maria@example.com',
        telefono: '8091234567',
        nombres: 'María',
        apellidos: 'Rodríguez',
      }).success,
    ).toBe(true);
  });
});
