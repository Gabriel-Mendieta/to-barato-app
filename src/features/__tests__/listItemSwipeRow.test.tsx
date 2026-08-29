import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, View } from 'react-native';
import { ListItemSwipeRow } from '@/src/features/lists/ListItemSwipeRow';

jest.mock('react-native-gesture-handler', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const { View: NativeView } = jest.requireActual<typeof import('react-native')>('react-native');

  const createGesture = () => {
    const gesture: Record<string, jest.Mock> = {};
    ['activeOffsetX', 'failOffsetY', 'onBegin', 'onUpdate', 'onEnd'].forEach((method) => {
      gesture[method] = jest.fn(() => gesture);
    });
    return gesture;
  };

  return {
    Gesture: { Pan: jest.fn(createGesture) },
    GestureDetector: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement(NativeView, null, children),
  };
});

jest.mock('react-native-reanimated', () => {
  const { View: NativeView } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    __esModule: true,
    default: { View: NativeView },
    useAnimatedStyle: jest.fn(() => ({})),
    useSharedValue: jest.fn((value: number) => ({ value })),
    withSpring: jest.fn((value: number) => value),
  };
});

describe('ListItemSwipeRow', () => {
  it('monta el gesto moderno y conserva la acción accesible de eliminar', () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <ListItemSwipeRow
        renderRightActions={
          <Pressable testID="delete-list-item" onPress={onDelete} accessibilityRole="button" />
        }
      >
        <View testID="list-item-content" />
      </ListItemSwipeRow>,
    );

    expect(getByTestId('list-item-content')).toBeTruthy();
    fireEvent.press(getByTestId('delete-list-item'));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
