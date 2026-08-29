import React from 'react';
import { fireEvent, render, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ShoppingListCard } from '@/src/features/lists/ShoppingListCard';
import { CreateListButton } from '@/src/shared/ui/CreateListButton';
import { colors } from '@/src/shared/theme';
import ShoppingListScreen from '@/app/tabs/lista';

const mockScreenState = {
  pending: false,
  error: false,
  lists: [] as {
    IdLista: number;
    IdUsuario: number;
    IdProveedor: number;
    Nombre: string;
    PrecioTotal: string;
    FechaCreacion: string;
  }[],
};

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ShoppingListScreen />
    </SafeAreaProvider>,
  );
}

jest.mock('expo-router', () => ({
  router: {
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({
      data: mockScreenState.pending ? undefined : 1,
      isPending: mockScreenState.pending,
      isSuccess: !mockScreenState.pending,
      isError: false,
    }),
  };
});

jest.mock('@/src/features/lists/hooks', () => ({
  useLists: () => ({
    data: mockScreenState.lists,
    isPending: mockScreenState.pending,
    isError: mockScreenState.error,
    refetch: jest.fn(),
  }),
  useListItemCounts: () => [],
  useCreateList: () => ({ isPending: false, mutateAsync: jest.fn() }),
  useDeleteList: () => ({ isPending: false, mutate: jest.fn() }),
}));

jest.mock('@/src/features/providers/hooks', () => ({
  useProviders: () => ({ data: [], refetch: jest.fn() }),
  useProviderTypes: () => ({ data: [], isPending: false, isError: false }),
}));

jest.mock('@/src/shared/ui/Stagger', () => ({
  Stagger: ({ children }: { children: React.ReactNode }) => children,
  FadeInUp: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/src/shared/ui/Sparkline.native', () => ({
  Sparkline: () => null,
}));

jest.mock('@/src/shared/ui/Skeleton', () => ({
  Skeleton: () => null,
}));

jest.mock('@/src/shared/ui/CreateListModal', () => {
  const { View: mockView } = jest.requireActual<typeof import('react-native')>('react-native');
  const mockReact = jest.requireActual<typeof React>('react');

  return {
    CreateListModal: ({ visible }: { visible: boolean }) =>
      visible ? mockReact.createElement(mockView, { testID: 'create-list-modal' }) : null,
  };
});

jest.mock('@/src/shared/ui/BottomSheetCompat', () => ({
  BottomSheetBackdrop: () => null,
  BottomSheetModal: () => null,
  BottomSheetView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('CreateListButton', () => {
  it('dispara el flujo de creación al pulsarlo', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <CreateListButton label="Crear nueva lista" onPress={onPress} />,
    );

    const style = StyleSheet.flatten(getByTestId('create-list-button').props.style);
    expect(style).toEqual(expect.objectContaining({ width: '100%', minHeight: 64 }));
    fireEvent.press(getByTestId('create-list-button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('expone el estado disabled y no dispara el flujo', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <CreateListButton label="Crear nueva lista" onPress={onPress} disabled />,
    );
    const button = getByTestId('create-list-button');

    expect(button.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });

  it('mantiene cada lista y su contenido dentro de una card de ancho completo', () => {
    const onPress = jest.fn();
    const onMenu = jest.fn();
    const { getByTestId, getByText } = render(
      <ShoppingListCard
        item={{
          IdLista: 7,
          IdUsuario: 1,
          IdProveedor: 1,
          Nombre: 'Frutas y vegetales',
          PrecioTotal: '100.00',
          FechaCreacion: '2026-08-29',
        }}
        index={0}
        count={2}
        selected={false}
        articleLabel="2 artículos"
        purchasedLabel="1 comprados"
        listOptionsLabel="Opciones de lista"
        onPress={onPress}
        onLongPress={jest.fn()}
        onMenu={onMenu}
      />,
    );

    const card = getByTestId('shopping-list-card-7');
    const cardStyle = StyleSheet.flatten(card.props.style);
    expect(cardStyle).toEqual(
      expect.objectContaining({
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: 18,
      }),
    );
    expect(getByText('Frutas y vegetales')).toBeTruthy();
    expect(getByText('2 artículos')).toBeTruthy();
    expect(within(card).getByTestId('shopping-list-progress-7')).toBeTruthy();

    fireEvent.press(within(card).getByTestId('shopping-list-menu-7'));
    expect(onMenu).toHaveBeenCalledTimes(1);
    fireEvent.press(getByText('Frutas y vegetales'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('ShoppingListScreen states', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockScreenState.pending = false;
    mockScreenState.error = false;
    mockScreenState.lists = [];
  });

  it('mantiene un contenedor estable durante loading', () => {
    mockScreenState.pending = true;

    expect(renderScreen().getByTestId('lists-loading-state')).toBeTruthy();
  });

  it('mantiene un contenedor estable en error', () => {
    mockScreenState.error = true;

    expect(renderScreen().getByTestId('lists-error-state')).toBeTruthy();
  });

  it('mantiene un contenedor estable cuando no hay listas', () => {
    expect(renderScreen().getByTestId('lists-empty-state')).toBeTruthy();
  });

  it('abre el modal real de creación desde el botón de la lista', () => {
    mockScreenState.lists = [
      {
        IdLista: 1,
        IdUsuario: 1,
        IdProveedor: 1,
        Nombre: 'Compras semana',
        PrecioTotal: '100.00',
        FechaCreacion: '2026-08-29',
      },
    ];

    const screen = renderScreen();
    fireEvent.press(screen.getByTestId('create-list-button'));

    expect(screen.getByTestId('create-list-modal')).toBeTruthy();
  });

  it('mantiene gutter y espacio vertical en la columna de listas', () => {
    mockScreenState.lists = [
      {
        IdLista: 1,
        IdUsuario: 1,
        IdProveedor: 1,
        Nombre: 'Compras semana',
        PrecioTotal: '100.00',
        FechaCreacion: '2026-08-29',
      },
    ];

    const list = renderScreen().getByTestId('shopping-lists');
    expect(list.props.contentContainerStyle).toEqual(
      expect.objectContaining({
        flexGrow: 1,
        paddingHorizontal: 16,
      }),
    );
  });

  it('conserva la navegación desde una card hacia el detalle', () => {
    mockScreenState.lists = [
      {
        IdLista: 7,
        IdUsuario: 1,
        IdProveedor: 2,
        Nombre: 'Desayuno',
        PrecioTotal: '100.00',
        FechaCreacion: '2026-08-29',
      },
    ];

    fireEvent.press(renderScreen().getByText('Desayuno'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/tabs/list/[id]',
      params: {
        id: '7',
        idProveedor: '2',
        nombre: 'Desayuno',
      },
    });
  });
});
