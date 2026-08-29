import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EditProfileScreen, { getEditProfileFormWidth } from '../EditProfile';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockShowToast = jest.fn();
const mockTriggerHaptic = jest.fn();
const mockMutateAsync = jest.fn();
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
const mockCurrentUserResult = { data: mockUser, isPending: false, isError: false };
const mockUpdateUserResult = { mutateAsync: mockMutateAsync, isPending: false };

jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('@/src/shared/api', () => ({
  clearSession: jest.fn(async () => undefined),
  getAccessToken: jest.fn(async () => 'offline-token'),
  getApiErrorMessage: jest.fn(() => 'Intenta nuevamente.'),
  getUserId: jest.fn(async () => '1'),
}));

jest.mock('@/src/features/profile/hooks', () => ({
  useCurrentUser: () => mockCurrentUserResult,
  useUpdateUser: () => mockUpdateUserResult,
}));

jest.mock('@/src/shared/ui', () => {
  const { Button } = jest.requireActual('@/src/shared/ui/Button');
  return {
    Button,
    showToast: (...args: unknown[]) => mockShowToast(...args),
    triggerHaptic: (...args: unknown[]) => mockTriggerHaptic(...args),
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'profile.back': 'Volver',
        'profile.editTitle': 'Editar perfil',
        'profile.editPhoto': 'Editar foto de perfil',
        'profile.photoEditUnavailable': 'Cambiar la foto aún no está disponible.',
        'profile.name': 'Nombre',
        'profile.namePlaceholder': 'Ingresa tu nombre',
        'profile.nameHint': 'Como aparece en tu perfil',
        'profile.email': 'Correo electrónico',
        'profile.emailHint': 'Ingrese su correo',
        'profile.phone': 'Teléfono',
        'profile.phonePlaceholder': 'Ingresa tu teléfono',
        'profile.phoneHint': 'Para alertas y verificación',
        'profile.nameRequired': 'El nombre es obligatorio.',
        'profile.phoneInvalid': 'Ingresa un teléfono válido (mínimo 7 caracteres).',
        'profile.sessionExpired': 'Sesión expirada',
        'profile.sessionExpiredBody': 'Inicia sesión nuevamente.',
        'profile.noChanges': 'Sin cambios',
        'profile.noChangesBody': 'No hubo modificaciones para guardar.',
        'profile.updated': 'Perfil actualizado',
        'profile.updateFailed': 'No se pudo actualizar',
        'profile.tryAgain': 'Intenta nuevamente.',
        'profile.saveChanges': 'Guardar cambios',
      })[key] ?? key,
  }),
}));

function renderEditProfile() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 402, height: 874 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <EditProfileScreen />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockMutateAsync.mockResolvedValue({
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
  });
});

describe('Editar perfil', () => {
  it('monta la pantalla del ZIP con sus textos y valores offline', async () => {
    renderEditProfile();

    await waitFor(() => expect(screen.getByTestId('edit-profile-name-input')).toBeTruthy());

    expect(screen.getByTestId('edit-profile-screen')).toBeTruthy();
    expect(screen.getByText('Editar perfil')).toBeTruthy();
    expect(screen.getByText('Nombre')).toBeTruthy();
    expect(screen.getByText('Correo electrónico')).toBeTruthy();
    expect(screen.getByText('Teléfono')).toBeTruthy();
    expect(screen.getByDisplayValue('María Rodríguez')).toBeTruthy();
    expect(screen.getByDisplayValue('maria@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('8095551234')).toBeTruthy();
    expect(screen.getByText('Guardar cambios')).toBeTruthy();
    expect(screen.getByText('Como aparece en tu perfil')).toBeTruthy();
    expect(screen.getByText('Ingrese su correo')).toBeTruthy();
    expect(screen.getByText('Para alertas y verificación')).toBeTruthy();
    expect(screen.getByTestId('edit-profile-avatar')).toBeTruthy();
    expect(screen.getByTestId('edit-profile-avatar-edit')).toBeTruthy();
    expect(screen.queryAllByText(/^profile\./)).toHaveLength(0);
  });

  it('expone un editor de avatar honesto cuando no hay contrato de upload', async () => {
    renderEditProfile();
    await screen.findByTestId('edit-profile-avatar');

    fireEvent.press(screen.getByTestId('edit-profile-avatar-edit'));

    expect(mockShowToast).toHaveBeenCalledWith('info', 'Cambiar la foto aún no está disponible.');
  });

  it('conserva el formulario usable con teclado y anchos de teléfono/tablet', async () => {
    const view = renderEditProfile();
    await screen.findByTestId('edit-profile-name-input');

    expect(view.UNSAFE_queryByType(KeyboardAvoidingView)).toBeTruthy();
    expect(getEditProfileFormWidth(402)).toBe(370);
    expect(getEditProfileFormWidth(430)).toBe(398);
    expect(getEditProfileFormWidth(834)).toBe(720);
  });

  it('mantiene el email de solo lectura y valida nombre antes de enviar', async () => {
    renderEditProfile();
    const nameInput = await screen.findByTestId('edit-profile-name-input');

    expect(screen.getByTestId('edit-profile-email-input').props.editable).toBe(false);
    fireEvent.changeText(nameInput, '');

    await waitFor(() => expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy());
    fireEvent.press(screen.getByTestId('edit-profile-save'));
    await waitFor(() => expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy());
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('envía nombre y teléfono, muestra éxito y regresa', async () => {
    renderEditProfile();
    const nameInput = await screen.findByTestId('edit-profile-name-input');
    const phoneInput = screen.getByTestId('edit-profile-phone-input');

    fireEvent.changeText(nameInput, 'Pedro González');
    fireEvent.changeText(phoneInput, '8091112222');
    await waitFor(() => expect(screen.getByDisplayValue('Pedro González')).toBeTruthy());
    fireEvent.press(screen.getByTestId('edit-profile-save'));

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({
        Nombres: 'Pedro',
        Apellidos: 'González',
        Telefono: '8091112222',
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Perfil actualizado');
    expect(mockBack).toHaveBeenCalled();
  });

  it('muestra loading mientras espera la actualización', async () => {
    let resolveMutation!: (user: typeof mockUser) => void;
    mockMutateAsync.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveMutation = resolve;
        }),
    );
    const view = renderEditProfile();
    const nameInput = await screen.findByTestId('edit-profile-name-input');

    fireEvent.changeText(nameInput, 'Pedro González');
    await waitFor(() => expect(screen.getByDisplayValue('Pedro González')).toBeTruthy());
    fireEvent.press(screen.getByTestId('edit-profile-save'));

    await waitFor(() => expect(view.UNSAFE_queryByType(ActivityIndicator)).toBeTruthy());
    resolveMutation({ ...mockUser, Nombres: 'Pedro', Apellidos: 'González' });
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('muestra error de submit y conserva hitboxes accesibles en anchos objetivo', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('network'));
    const view = renderEditProfile();
    const nameInput = await screen.findByTestId('edit-profile-name-input');

    fireEvent.changeText(nameInput, 'Pedro González');
    await waitFor(() => expect(screen.getByDisplayValue('Pedro González')).toBeTruthy());
    fireEvent.press(screen.getByTestId('edit-profile-save'));

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        'error',
        'No se pudo actualizar',
        'Intenta nuevamente.',
      ),
    );
    const backStyle = StyleSheet.flatten(screen.getByTestId('edit-profile-back').props.style);
    const saveStyle = StyleSheet.flatten(screen.getByTestId('edit-profile-save').props.style);
    expect(backStyle).toEqual(expect.objectContaining({ width: 44, height: 44 }));
    expect(saveStyle).toEqual(expect.objectContaining({ minHeight: 54 }));
    expect(StyleSheet.flatten(screen.getByTestId('edit-profile-name-input').props.style)).toEqual(
      expect.objectContaining({ minHeight: 54 }),
    );
    expect(view.UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });
});
