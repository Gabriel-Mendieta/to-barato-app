import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProfileScreen from '../index';

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
        'profile.privacySecuritySubtitle': 'Contraseña',
        'profile.logout': 'Cerrar Sesión',
        'profile.logoutSubtitle': 'Salir de la cuenta',
        'profile.comingSoon': 'Próximamente',
        'profile.defaultName': 'Usuario',
        'profile.saved': 'Ahorrado',
        'profile.products': 'Productos',
        'profile.lists': 'Listas',
        'profile.metricUnavailable': 'N/D',
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

    expect(screen.getByText('Hola')).toBeTruthy();
    expect(screen.getByText('María Rodríguez')).toBeTruthy();
    expect(within(screen.getByTestId('profile-metric-products')).getByText('3')).toBeTruthy();
    expect(within(screen.getByTestId('profile-metric-lists')).getByText('2')).toBeTruthy();
    expect(within(screen.getByTestId('profile-metric-savings')).getByText('N/D')).toBeTruthy();
    expect(screen.getByText('Editar perfil')).toBeTruthy();
    expect(screen.getByText('Preferencias')).toBeTruthy();
    expect(screen.getByText('Notificaciones')).toBeTruthy();
    expect(screen.getByText('Privacidad y seguridad')).toBeTruthy();
    expect(screen.getByText('Cerrar Sesión')).toBeTruthy();
  });

  it('muestra fallback cuando las listas offline no están disponibles', async () => {
    mockUseLists.mockReturnValue({ data: undefined, isPending: false, isError: true });
    mockUseListItemCounts.mockReturnValue([]);
    const screen = renderProfile();

    await waitFor(() => expect(screen.getByTestId('profile-metric-lists')).toBeTruthy());

    expect(within(screen.getByTestId('profile-metric-products')).getByText('N/D')).toBeTruthy();
    expect(within(screen.getByTestId('profile-metric-lists')).getByText('N/D')).toBeTruthy();
    expect(within(screen.getByTestId('profile-metric-savings')).getByText('N/D')).toBeTruthy();
  });

  it('conserva las acciones de editar, preferencias, privacidad y cierre de sesión', async () => {
    const screen = renderProfile();
    await waitFor(() => expect(screen.getByTestId('profile-option-edit')).toBeTruthy());

    fireEvent.press(screen.getByTestId('profile-option-edit'));
    expect(mockPush).toHaveBeenCalledWith('/tabs/settings/EditProfile');

    fireEvent.press(screen.getByTestId('profile-option-preferences'));
    expect(mockShowToast).toHaveBeenCalledWith('info', 'Preferencias', 'Próximamente');

    fireEvent.press(screen.getByTestId('profile-option-privacy'));
    expect(mockPush).toHaveBeenCalledWith('/tabs/settings/ChangePassword');

    fireEvent.press(screen.getByTestId('profile-option-logout'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth/IniciarSesion'));
    expect(mockClear).toHaveBeenCalled();
  });
});
