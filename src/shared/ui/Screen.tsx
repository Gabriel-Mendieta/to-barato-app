import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing, typography } from '../theme';

type Edge = 'top' | 'bottom' | 'left' | 'right';

type Props = {
  children: React.ReactNode;
  /** Center content and cap width on tablets / wide web. */
  adaptive?: boolean;
  backgroundColor?: string;
  /**
   * Safe-area edges to pad. Default pads top + bottom.
   * Pass [] when the screen manages insets itself (e.g. full-bleed heroes).
   */
  edges?: Edge[];
  /** Horizontal content gutter. Default true. */
  gutters?: boolean;
  style?: ViewStyle;
};

export function Screen({
  children,
  adaptive = true,
  backgroundColor = colors.bg,
  edges = ['top', 'bottom'],
  gutters = true,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= layout.tabletBreakpoint;
  const pad = (edge: Edge) => (edges.includes(edge) ? insets[edge] : 0);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor,
          paddingTop: pad('top'),
          paddingBottom: pad('bottom'),
          paddingLeft: gutters
            ? (wide ? layout.gutterWide : layout.gutter) + pad('left')
            : pad('left'),
          paddingRight: gutters
            ? (wide ? layout.gutterWide : layout.gutter) + pad('right')
            : pad('right'),
        },
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          adaptive && wide
            ? { maxWidth: layout.maxContentWidth, alignSelf: 'center', width: '100%' }
            : null,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export function ScreenTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
  title: {
    fontFamily: typography.extrabold,
    fontSize: 24,
    color: colors.navy,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
});
