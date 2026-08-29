import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CreateListButton } from '@/src/shared/ui/CreateListButton';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('CreateListButton', () => {
  it('dispara el flujo de creación al pulsarlo', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <CreateListButton label="Crear nueva lista" onPress={onPress} />,
    );

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
});
