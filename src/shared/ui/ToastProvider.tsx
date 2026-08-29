import React from 'react';
import Toast from 'react-native-toast-message';

export type ToastKind = 'success' | 'error' | 'info';

export function ToastProvider() {
  return <Toast />;
}

export function showToast(type: ToastKind, text1: string, text2?: string) {
  Toast.show({ type, text1, text2, position: 'top', visibilityTime: 2600 });
}
