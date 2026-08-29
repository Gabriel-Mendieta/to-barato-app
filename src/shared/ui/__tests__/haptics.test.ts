import * as Haptics from 'expo-haptics';
import { triggerHaptic } from '../haptics';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
}));

describe('triggerHaptic', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses selection feedback for selection intents', async () => {
    await triggerHaptic('selection');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('does not reject when native haptics are unavailable', async () => {
    (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('unsupported'));
    await expect(triggerHaptic('light')).resolves.toBeUndefined();
  });
});
