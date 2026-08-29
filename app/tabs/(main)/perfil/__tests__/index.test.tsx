import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProfileScreen, { getProfileContentMaxWidth } from '../index';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockClear = jest.fn();
const mockShowToast = jest.fn();
const mockUseCurrentUser = jest.fn();
const mockUseLists = jest.fn();
const mockUseListItemCounts = jest.fn();
const mockGetAccessToken = jest.fn(async () => 'offline-token');
const mockGetUserId = jest.fn(async () => '1');

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('@/src/shared/api', () => ({
  clearSession: (...args: unknown[]) => mockClear(...args),
  getAccessToken: () => mockGetAccessToken(),
  getUserId: () => mockGetUserId(),
  queryClient: { clear: (...args: unknown[]) => mockClear(...args) },
}));

jest.mock('@/src/shared/ui', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

jest.mock('@/src/features/profile/hooks', () => ({
  useCurrentUser: (...args: unknown[]) => mockUseCurrentUser(...args),
}));

jest.mock('@/src/features/lists/hooks', () => ({
  useLists: (...args: unknown[]) => mockUseLists(...args),
  useListItemCounts: (...args: unknown[]) => mockUseListItemCounts(...args),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { version?: string }) => {
      const translations: Record<string, string> = {
        'profile.brandLogo': "Logotipo de To' Barato",
        'profile.brandName': "To'\nBarato",
        'profile.hello': 'Hola',
        'profile.online': 'Usuario activo',
        'profile.notifications': 'Notificaciones',
        'profile.notificationsSubtitle': 'Alertas de precios',
        'profile.offers': 'Ofertas y Promociones',
        'profile.offerDescription': 'Oferta disponible',
        'profile.reminder': 'Recordatorio de Lista de Compras',
        'profile.reminderDescription': 'Recuerda tu lista',
        'profile.priceUpdate': 'Actualización de Precios',
        'profile.priceUpdateDescription': 'El precio bajó',
        'profile.fourHoursAgo': 'Hace 4 horas',
        'profile.oneDayAgo': 'Hace 1 día',
        'profile.twelveDaysAgo': 'Hace 12 días',
        'profile.close': 'Cerrar',
        'profile.editProfile': 'Editar perfil',
        'profile.editProfileSubtitle': 'Nombre, correo, teléfono',
        'profile.preferences': 'Preferencias',
        'profile.preferencesSubtitle': 'Productos favoritos, tiendas',
        'profile.privacySecurity': 'Privacidad y seguridad',
        'profile.privacySecuritySubtitle': 'Contraseña, 2FA',
        'profile.logout': 'Cerrar Sesión',
        'profile.logoutSubtitle': 'Salir de la cuenta',
        'profile.comingSoon': 'Próximamente',
        'profile.defaultName': 'Usuario',
        'profile.saved': 'Ahorrado',
        'profile.products': 'Productos',
        'profile.lists': 'Listas',
        'profile.metricUnavailable': 'No disponible',
        'profile.footer': `To' Barato v${options?.version ?? '1.0.0'} · Hecho en RD 🇩🇴`,
        'profile.sessionExpired': 'Sesión expirada',
        'profile.sessionExpiredBody': 'Inicia sesión nuevamente.',
      };
      return translations[key] ?? key;
    },
  }),
}));

function renderProfile() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ProfileScreen />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCurrentUser.mockReturnValue({
    data: {
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
    },
    isPending: false,
    isError: false,
  });
  mockUseLists.mockReturnValue({
    data: [
      {
        IdLista: 1,
        IdUsuario: 1,
        IdProveedor: 1,
        Nombre: 'Compras',
        PrecioTotal: '100.00',
        FechaCreacion: '',
      },
      {
        IdLista: 2,
        IdUsuario: 1,
        IdProveedor: 2,
        Nombre: 'Desayuno',
        PrecioTotal: '50.00',
        FechaCreacion: '',
      },
    ],
    isPending: false,
    isError: false,
  });
  mockUseListItemCounts.mockReturnValue([
    { data: [{ IdProducto: 1 }, { IdProducto: 2 }], isPending: false, isError: false },
    { data: [{ IdProducto: 3 }], isPending: false, isError: false },
  ]);
});

describe('Perfil', () => {
  it('monta hero, métricas reales y opciones principales', async () => {
    const screen = renderProfile();

    await waitFor(() => expect(screen.getByTestId('profile-hero')).toBeTruthy());

    expect(screen.getByText('María Rodríguez')).toBeTruthy();
    expect(screen.getByText('maria@example.com')).toBeTruthy();
    expect(screen.getByText('8095551234')).toBeTruthy();
    expect(within(screen.getByTestId('profile-metric-products')).getByText('3')).toBeTruthy();
    expect(within(screen.getByTestId('profile-metric-lists')).getByText('2')).toBeTruthy();
    expect(
      within(screen.getByTestId('profile-metric-savings')).getByText('No disponible'),
    ).toBeTruthy();
    expect(screen.getByText('Editar perfil')).toBeTruthy();
    expect(screen.getByText('Preferencias')).toBeTruthy();
    expect(screen.getByText('Notificaciones')).toBeTruthy();
    expect(screen.getByText('Privacidad y seguridad')).toBeTruthy();
    expect(screen.getByText('Cerrar Sesión')).toBeTruthy();

    const editOption = screen.getByTestId('profile-option-edit');
    const editStyle = StyleSheet.flatten(editOption.props.style);
    const editSurface = screen.getByTestId('profile-option-edit-surface');
    const editSurfaceStyle = StyleSheet.flatten(editSurface.props.style);
    expect(editStyle).toEqual(expect.objectContaining({ width: '100%', minHeight: 72 }));
    expect(editSurfaceStyle).toEqual(
      expect.objectContaining({
        backgroundColor: '#ffffff',
        width: '100%',
        minHeight: 72,
        borderRadius: 18,
        borderWidth: 1,
        shadowOpacity: expect.any(Number),
        elevation: expect.any(Number),
      }),
    );
    expect(editOption.props.accessibilityRole).toBe('button');
    expect(editOption.props.accessibilityHint).toBe('Nombre, correo, teléfono');
    expect(screen.getByTestId('profile-option-edit-trailing')).toBeTruthy();
    expect(screen.getByTestId('profile-option-edit-chevron')).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByTestId('profile-option-edit-chevron').props.style),
    ).toEqual(expect.objectContaining({ width: 44, height: 44 }));
    expect(
      StyleSheet.flatten(screen.getByTestId('profile-option-edit-surface').props.style).position,
    ).not.toBe('absolute');
    expect(
      StyleSheet.flatten(screen.getByTestId('profile-option-edit-surface').props.style)
        .flexDirection,
    ).toBe('row');
    expect(
      StyleSheet.flatten(screen.getByTestId('profile-option-edit-surface').props.style).padding,
    ).toBe(16);
    for (const id of ['edit', 'preferences', 'notifications', 'privacy', 'logout']) {
      const option = screen.getByTestId(`profile-option-${id}`);
      const chevron = screen.getByTestId(`profile-option-${id}-chevron`);
      expect(option.props.accessibilityRole).toBe('button');
      expect(chevron.props.accessibilityRole).toBe('button');
      expect(StyleSheet.flatten(chevron.props.style)).toEqual(
        expect.objectContaining({ width: 44, height: 44 }),
      );
    }
    expect(
      within(screen.getByTestId('profile-option-preferences-badge')).getByText('3'),
    ).toBeTruthy();
    expect(screen.getByTestId('profile-option-notifications-badge')).toBeTruthy();
    expect(
      within(screen.getByTestId('profile-option-notifications-badge')).getByText('2'),
    ).toBeTruthy();
    expect(screen.queryAllByText(/^profile\./)).toHaveLength(0);
  });

  it('muestra fallback cuando las listas offline no están disponibles', async () => {
    mockUseLists.mockReturnValue({ data: undefined, isPending: false, isError: true });
    mockUseListItemCounts.mockReturnValue([]);
    const screen = renderProfile();

    await waitFor(() => expect(screen.getByTestId('profile-metric-lists')).toBeTruthy());

    expect(
      within(screen.getByTestId('profile-metric-products')).getByText('No disponible'),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId('profile-metric-lists')).getByText('No disponible'),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId('profile-metric-savings')).getByText('No disponible'),
    ).toBeTruthy();
  });

  it('mantiene filas y texto estables en anchos mayores y nombres largos', async () => {
    mockUseCurrentUser.mockReturnValue({
      data: {
        IdTipoUsuario: 1,
        NombreUsuario: 'mariard',
        Correo: 'maria.rodriguez.long@example.com',
        Telefono: '8095551234',
        Nombres: 'María Fernanda Alejandra',
        Apellidos: 'Rodríguez de la Cruz Martínez',
        Estado: true,
        UrlPerfil: null,
        FechaNacimiento: '1992-03-18',
        IdUsuario: 1,
        FechaCreacion: '2024-01-01T00:00:00Z',
      },
      isPending: false,
      isError: false,
    });
    expect(getProfileContentMaxWidth(834)).toBe(720);
    expect(getProfileContentMaxWidth(402)).toBe(370);

    const screen = renderProfile();

    await waitFor(() => expect(screen.getByTestId('profile-options')).toBeTruthy());

    const contentStyle = StyleSheet.flatten(screen.getByTestId('profile-content').props.style);
    expect(contentStyle.width).toBe('100%');
    expect(contentStyle.maxWidth).toBeGreaterThan(0);
    expect(contentStyle.maxWidth).toBeLessThanOrEqual(720);

    for (const id of ['edit', 'preferences', 'notifications', 'privacy', 'logout']) {
      const surface = screen.getByTestId(`profile-option-${id}-surface`);
      const surfaceStyle = StyleSheet.flatten(surface.props.style);
      expect(surfaceStyle).toEqual(
        expect.objectContaining({
          width: '100%',
          minHeight: 72,
          borderRadius: 18,
          shadowOpacity: expect.any(Number),
          elevation: expect.any(Number),
        }),
      );
      expect(surfaceStyle.position).not.toBe('absolute');
    }

    const title = screen.getByText('María Fernanda Alejandra Rodríguez de la Cruz Martínez');
    expect(title.props.numberOfLines).toBe(2);
    expect(title.props.ellipsizeMode).toBe('tail');
  });

  it('conserva las acciones de editar, preferencias, privacidad y cierre de sesión', async () => {
    const screen = renderProfile();
    await waitFor(() => expect(screen.getByTestId('profile-option-edit')).toBeTruthy());

    fireEvent.press(screen.getByTestId('profile-option-edit'));
    expect(mockPush).toHaveBeenCalledWith('/tabs/settings/EditProfile');

    fireEvent.press(screen.getByTestId('profile-edit-hero'));
    expect(mockPush).toHaveBeenCalledWith('/tabs/settings/EditProfile');

    fireEvent.press(screen.getByTestId('profile-notifications-header'));
    expect(screen.getByTestId('profile-notifications-close')).toBeTruthy();
    fireEvent.press(screen.getByTestId('profile-notifications-close'));

    fireEvent.press(screen.getByTestId('profile-option-preferences'));
    expect(mockShowToast).toHaveBeenCalledWith('info', 'Preferencias', 'Próximamente');

    fireEvent.press(screen.getByTestId('profile-option-notifications'));
    expect(screen.getByText('Oferta disponible')).toBeTruthy();
    fireEvent.press(screen.getByTestId('profile-notifications-done'));
    expect(screen.queryByTestId('profile-notifications-close')).toBeNull();

    fireEvent.press(screen.getByTestId('profile-option-privacy'));
    expect(mockPush).toHaveBeenCalledWith('/tabs/settings/ChangePassword');

    fireEvent.press(screen.getByTestId('profile-option-privacy-chevron'));
    expect(mockPush).toHaveBeenCalledWith('/tabs/settings/ChangePassword');

    fireEvent.press(screen.getByTestId('profile-option-logout'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth/IniciarSesion'));
    expect(mockClear).toHaveBeenCalled();
  });
});
