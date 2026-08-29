import Toast from 'react-native-toast-message';
import { showToast } from '../ToastProvider';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    hide: jest.fn(),
    show: jest.fn(),
  },
}));

describe('showToast', () => {
  beforeEach(() => jest.clearAllMocks());

  it('auto-oculta los avisos y permite descartarlos al pulsarlos', () => {
    showToast('info', 'Próximamente', 'Función no disponible');

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        autoHide: true,
        visibilityTime: 2600,
      }),
    );

    const options = (Toast.show as jest.Mock).mock.calls[0][0] as {
      onPress: () => void;
    };
    options.onPress();

    expect(Toast.hide).toHaveBeenCalledTimes(1);
  });
});
