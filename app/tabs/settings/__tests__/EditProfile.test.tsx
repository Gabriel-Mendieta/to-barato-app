import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { darkColors, lightColors } from '@/src/shared/theme/tokens';
import EditProfileScreen, {
  getAvatarEditBadgeColors,
  getEditProfileFormWidth,
} from '../EditProfile';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockShowToast = jest.fn();
const mockTriggerHaptic = jest.fn();
const mockMutateAsync = jest.fn();
const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
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

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) =>
    mockRequestMediaLibraryPermissionsAsync(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
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
        'profile.editPhotoHint': 'Abre el selector de fotos para cambiar tu imagen.',
        'profile.photoSelected': 'Foto seleccionada',
        'profile.photoSelectedBody': 'Se guardará al tocar Guardar cambios.',
        'profile.photoPickerFailed': 'No se pudo seleccionar la foto',
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
        'profile.permissionDenied': 'Permiso denegado',
        'profile.photoPermissionBody': 'Necesitamos permiso para acceder a fotos.',
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
  mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
  mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
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

/** Pressable resolves `style` lazily, so tests must handle both shapes. */
function flattenPressableStyle(element: { props: { style?: unknown } }) {
  const { style } = element.props;
  return StyleSheet.flatten(
    typeof style === 'function'
      ? (style as (state: { pressed: boolean }) => unknown)({ pressed: false })
      : style,
  ) as Record<string, number>;
}

describe('Editar perfil', () => {
  function getTextContent(children: React.ReactNode): string {
    if (typeof children === 'string' || typeof children === 'number') return String(children);
    if (Array.isArray(children)) return children.map(getTextContent).join('');
    return '';
  }

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
    expect(screen.getByTestId('edit-profile-avatar-button')).toBeTruthy();
    const visibleText = screen
      .UNSAFE_getAllByType(Text)
      .map((node) => getTextContent(node.props.children))
      .filter(Boolean);
    expect(visibleText.some((text) => text.trim().startsWith('profile.'))).toBe(false);
  });

  it('expone un lápiz visible y accesible que abre el selector de fotos', async () => {
    renderEditProfile();
    await screen.findByTestId('edit-profile-avatar');

    const avatarWrapper = screen.getByTestId('edit-profile-avatar-wrapper');
    const pencil = within(avatarWrapper).getByTestId('edit-profile-avatar-button');
    const pencilStyle = flattenPressableStyle(pencil);
    const pencilIcon = pencil.findByProps({ name: 'pencil' });
    const avatarStyle = StyleSheet.flatten(avatarWrapper.props.style);

    expect(avatarStyle).toEqual(
      expect.objectContaining({
        width: 112,
        height: 112,
        position: 'relative',
        overflow: 'visible',
      }),
    );
    expect(pencil.props.accessibilityRole).toBe('button');
    expect(pencil.props.accessibilityLabel).toBe('Editar foto de perfil');
    expect(pencil.props.accessibilityHint).toBe(
      'Abre el selector de fotos para cambiar tu imagen.',
    );
    expect(pencilStyle).toEqual(
      expect.objectContaining({
        position: 'absolute',
        right: -6,
        bottom: -6,
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        backgroundColor: '#0B2545',
        borderColor: '#ffffff',
        shadowOpacity: 0.32,
        elevation: 8,
      }),
    );
    expect(pencilIcon.props).toEqual(
      expect.objectContaining({ name: 'pencil', size: 20, color: '#ffffff' }),
    );

    // The badge must overlap the lower-right quadrant of the avatar instead of
    // flowing underneath it, which is what happens when the absolute style is lost.
    const badgeCenterX = avatarStyle.width - pencilStyle.right - pencilStyle.width / 2;
    const badgeCenterY = avatarStyle.height - pencilStyle.bottom - pencilStyle.height / 2;
    expect(badgeCenterX).toBeGreaterThan(avatarStyle.width / 2);
    expect(badgeCenterX).toBeLessThan(avatarStyle.width);
    expect(badgeCenterY).toBeGreaterThan(avatarStyle.height / 2);
    expect(badgeCenterY).toBeLessThan(avatarStyle.height);
    expect(pencilStyle.width).toBeGreaterThanOrEqual(44);
    expect(pencilStyle.width).toBeLessThanOrEqual(48);
    expect(mockRequestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();

    fireEvent.press(pencil);

    await waitFor(() => expect(mockRequestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1));
    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith({
      mediaTypes: 'Images',
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });
  });

  it('mantiene el contraste del lápiz en claro y en oscuro', () => {
    expect(getAvatarEditBadgeColors(lightColors, 'light')).toEqual({
      background: '#0B2545',
      border: '#ffffff',
      icon: '#ffffff',
    });
    expect(getAvatarEditBadgeColors(darkColors, 'dark')).toEqual({
      background: darkColors.navy,
      border: darkColors.bg,
      icon: darkColors.bg,
    });
    // The icon must never share the badge background, in either scheme.
    expect(getAvatarEditBadgeColors(darkColors, 'dark').icon).not.toBe(darkColors.navy);
  });

  it('reproduce el top bar y las etiquetas del ZIP', async () => {
    renderEditProfile();
    await screen.findByTestId('edit-profile-name-input');

    const backStyle = flattenPressableStyle(screen.getByTestId('edit-profile-back'));
    expect(backStyle).toEqual(
      expect.objectContaining({
        width: 44,
        height: 44,
        borderWidth: 1,
        backgroundColor: '#ffffff',
        borderColor: '#E6E9F0',
      }),
    );

    const labelStyle = StyleSheet.flatten(screen.getByText('Nombre').props.style);
    expect(labelStyle).toEqual(
      expect.objectContaining({ textTransform: 'uppercase', color: '#0B2545' }),
    );

    const inputStyle = StyleSheet.flatten(
      screen.getByTestId('edit-profile-email-input').props.style,
    );
    expect(inputStyle).toEqual(
      expect.objectContaining({ borderRadius: 14, backgroundColor: '#ffffff' }),
    );
  });

  it('no cambia el avatar ni rompe el formulario al cancelar la selección', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: [] });
    renderEditProfile();
    await screen.findByTestId('edit-profile-avatar');

    fireEvent.press(screen.getByTestId('edit-profile-avatar-button'));

    await waitFor(() => expect(mockLaunchImageLibraryAsync).toHaveBeenCalled());
    expect(screen.queryByTestId('edit-profile-avatar-image')).toBeNull();
    expect(screen.getByTestId('edit-profile-name-input')).toBeTruthy();
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('informa permiso denegado sin abrir el selector ni romper el formulario', async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false });
    renderEditProfile();
    await screen.findByTestId('edit-profile-avatar');

    fireEvent.press(screen.getByTestId('edit-profile-avatar-button'));

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        'error',
        'Permiso denegado',
        'Necesitamos permiso para acceder a fotos.',
      ),
    );
    expect(mockLaunchImageLibraryAsync).not.toHaveBeenCalled();
    expect(screen.getByTestId('edit-profile-phone-input')).toBeTruthy();
  });

  it('muestra inmediatamente la imagen elegida y la envía con el submit', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/avatar.jpg' }],
    });
    renderEditProfile();
    await screen.findByTestId('edit-profile-avatar');

    fireEvent.press(screen.getByTestId('edit-profile-avatar-button'));

    const image = await screen.findByTestId('edit-profile-avatar-image');
    expect(image.props.source).toEqual({ uri: 'file:///tmp/avatar.jpg' });
    expect(mockShowToast).toHaveBeenCalledWith(
      'info',
      'Foto seleccionada',
      'Se guardará al tocar Guardar cambios.',
    );

    fireEvent.press(screen.getByTestId('edit-profile-save'));
    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({
        UrlPerfil: 'file:///tmp/avatar.jpg',
      }),
    );
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
