import React, { useImperativeHandle, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

export type BottomSheetModalMethods = {
  present: () => void;
  dismiss: () => void;
};

type ModalProps = {
  children?: React.ReactNode;
  onDismiss?: () => void;
  onRequestClose?: () => void;
  backdropComponent?: React.ComponentType<any>;
};

export const BottomSheetModal = React.forwardRef<BottomSheetModalMethods, ModalProps>(
  function WebBottomSheetModal({ children, onDismiss, onRequestClose }, ref) {
    const [visible, setVisible] = useState(false);
    const dismiss = () => {
      setVisible(false);
      onDismiss?.();
    };

    useImperativeHandle(ref, () => ({
      present: () => setVisible(true),
      dismiss,
    }));

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onRequestClose ?? dismiss}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
          <View style={styles.sheet}>{children}</View>
        </View>
      </Modal>
    );
  },
);

export function BottomSheetModalProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function BottomSheetBackdrop() {
  return null;
}

export const BottomSheetScrollView = ScrollView;
export const BottomSheetTextInput = TextInput;
export const BottomSheetView = View;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,37,69,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: '92%',
  },
});
