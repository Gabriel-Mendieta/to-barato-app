import React, { Children, isValidElement } from 'react';
import { View, ViewStyle } from 'react-native';
import { MotiView } from 'moti';

type FadeInUpProps = {
  children: React.ReactNode;
  /** Index in the stagger sequence (0-based). */
  index?: number;
  /** Delay between siblings in ms. */
  step?: number;
  /** Base delay before the first item. */
  delay?: number;
  /** Motion duration in ms. */
  duration?: number;
  style?: ViewStyle;
};

/**
 * Fade + slide-up entrance for a single block.
 * Use alone or via `<Stagger>` for sequential top→bottom reveals.
 */
export function FadeInUp({
  children,
  index = 0,
  step = 70,
  delay = 0,
  duration = 380,
  style,
}: FadeInUpProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration,
        delay: delay + index * step,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

type StaggerProps = {
  children: React.ReactNode;
  /** Delay between children in ms (snappy: 50–100). */
  step?: number;
  /** Initial delay before first child. */
  delay?: number;
  duration?: number;
  style?: ViewStyle;
};

/**
 * Wraps children so each appears sequentially from top to bottom.
 * Skips non-element children (null, false, text).
 */
export function Stagger({
  children,
  step = 70,
  delay = 40,
  duration = 380,
  style,
}: StaggerProps) {
  let index = 0;
  return (
    <View style={style}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        const i = index++;
        return (
          <FadeInUp key={child.key ?? i} index={i} step={step} delay={delay} duration={duration}>
            {child}
          </FadeInUp>
        );
      })}
    </View>
  );
}
