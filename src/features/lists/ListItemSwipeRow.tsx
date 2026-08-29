import React, { forwardRef, useImperativeHandle } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '@/src/shared/theme';

export type ListItemSwipeRowHandle = {
  close: () => void;
};

type Props = {
  children: React.ReactNode;
  renderRightActions: React.ReactNode;
};

const SWIPE_ACTION_WIDTH = 136;

/**
 * Modern RNGH gesture wrapper. The legacy Swipeable API tries to resolve its
 * child through the old handler view registry, which is not compatible with
 * the current React/function-component + new-architecture tree.
 */
export const ListItemSwipeRow = forwardRef<ListItemSwipeRowHandle, Props>(function ListItemSwipeRow(
  { children, renderRightActions },
  ref,
) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  useImperativeHandle(
    ref,
    () => ({
      close: () => {
        translateX.value = withSpring(0, { damping: 20, stiffness: 240 });
      },
    }),
    [translateX],
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const next = startX.value + event.translationX;
      translateX.value = Math.max(-SWIPE_ACTION_WIDTH, Math.min(0, next));
    })
    .onEnd((event) => {
      const open = translateX.value < -SWIPE_ACTION_WIDTH / 2 || event.velocityX < -500;
      translateX.value = withSpring(open ? -SWIPE_ACTION_WIDTH : 0, {
        damping: 20,
        stiffness: 240,
      });
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.row}>
      <View style={styles.actions}>{renderRightActions}</View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, animatedCardStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SWIPE_ACTION_WIDTH,
    backgroundColor: colors.red,
    borderRadius: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
