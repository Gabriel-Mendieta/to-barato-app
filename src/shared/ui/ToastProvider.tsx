import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';

export type ToastKind = 'success' | 'error' | 'info';

const TOAST_DEFAULT_OPTIONS = {
  position: 'top' as const,
  topOffset: 12,
  autoHide: true,
  swipeable: true,
  visibilityTime: 2600,
};

export function ToastProvider() {
  useEffect(() => {
    return () => {
      // Avoid leaving an animated host/timer alive when the root is replaced.
      Toast.hide();
    };
  }, []);

  return <Toast {...TOAST_DEFAULT_OPTIONS} />;
}

export function showToast(type: ToastKind, text1: string, text2?: string) {
  Toast.show({
    ...TOAST_DEFAULT_OPTIONS,
    type,
    text1,
    text2,
    onPress: () => Toast.hide(),
  });
}
