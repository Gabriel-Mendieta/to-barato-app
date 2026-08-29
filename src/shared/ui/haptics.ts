import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticIntent = 'selection' | 'success' | 'warning' | 'error' | 'light' | 'medium';

/**
 * Centralized, best-effort haptics. It is intentionally a no-op on web and
 * never blocks a user action when a simulator/device does not expose haptics.
 */
export async function triggerHaptic(intent: HapticIntent): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    if (intent === 'selection') {
      await Haptics.selectionAsync();
      return;
    }

    const style =
      intent === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : intent === 'warning'
          ? Haptics.NotificationFeedbackType.Warning
          : intent === 'error'
            ? Haptics.NotificationFeedbackType.Error
            : intent === 'medium'
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light;

    if (intent === 'success' || intent === 'warning' || intent === 'error') {
      await Haptics.notificationAsync(style as Haptics.NotificationFeedbackType);
    } else {
      await Haptics.impactAsync(style as Haptics.ImpactFeedbackStyle);
    }
  } catch {
    // Haptics is optional feedback and must not break the primary action.
  }
}
