export {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

export type BottomSheetModalMethods = {
  present: (...args: any[]) => void;
  dismiss: (...args: any[]) => void;
};
