import React from 'react';
import { Text } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/src/shared/i18n';
import EditProfileScreen from '../EditProfile';

const mockUser = {
  IdTipoUsuario: 1,
  NombreUsuario: 'mariard',
  Correo: 'maria@example.com',
  Telefono: '8095551234',
  Nombres: 'María',
  Apellidos: 'Rodríguez',
  Estado: true,
  UrlPerfil: null,
  FechaNacimiento: '1992-03-18',
  IdUsuario: 1,
  FechaCreacion: '2024-01-01T00:00:00Z',
};

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn() },
}));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

jest.mock('@/src/shared/api', () => ({
  clearSession: jest.fn(async () => undefined),
  getAccessToken: jest.fn(async () => 'offline-token'),
  getApiErrorMessage: jest.fn(() => 'Intenta nuevamente.'),
  getUserId: jest.fn(async () => '1'),
}));

jest.mock('@/src/features/profile/hooks', () => ({
  useCurrentUser: () => ({ data: mockUser, isPending: false, isError: false }),
  useUpdateUser: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@/src/shared/ui', () => {
  const { Button } = jest.requireActual('@/src/shared/ui/Button');
  return { Button, showToast: jest.fn(), triggerHaptic: jest.fn() };
});

function getTextContent(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  return '';
}

/**
 * The screen is rendered against the real locale bundle — a missing key surfaces
 * as the raw `profile.*` identifier on screen instead of Spanish copy.
 */
describe('Editar perfil con el i18n real', () => {
  it('no filtra claves profile.* en el texto visible', async () => {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 402, height: 874 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}
      >
        <I18nextProvider i18n={i18n}>
          <EditProfileScreen />
        </I18nextProvider>
      </SafeAreaProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('edit-profile-name-input')).toBeTruthy());

    const visibleText = screen
      .UNSAFE_getAllByType(Text)
      .map((node) => getTextContent(node.props.children))
      .filter(Boolean);

    expect(visibleText.length).toBeGreaterThan(0);
    expect(visibleText.filter((text) => text.includes('profile.'))).toEqual([]);
    expect(visibleText).toEqual(
      expect.arrayContaining([
        'Editar perfil',
        'Nombre',
        'Correo electrónico',
        'Teléfono',
        'Guardar cambios',
      ]),
    );
  });

  it('traduce las etiquetas accesibles de la cabecera y del editor de foto', async () => {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 402, height: 874 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}
      >
        <I18nextProvider i18n={i18n}>
          <EditProfileScreen />
        </I18nextProvider>
      </SafeAreaProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('edit-profile-name-input')).toBeTruthy());

    const back = screen.getByTestId('edit-profile-back');
    const pencil = screen.getByTestId('edit-profile-avatar-button');

    expect(back.props.accessibilityLabel).toBe('Volver');
    expect(pencil.props.accessibilityLabel).toBe('Editar foto de perfil');
    expect(pencil.props.accessibilityHint).toBe(
      'Abre el selector de fotos para cambiar tu imagen.',
    );
    expect(pencil.props.accessibilityLabel).not.toContain('profile.');
  });
});
