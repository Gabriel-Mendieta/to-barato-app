import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { typography, useThemeColors } from '../theme';

type Props = {
  data?: number[];
  labels?: string[];
  height?: number;
  color?: string;
};

/**
 * Web-safe fallback for the native Gifted Charts implementation. Expo's
 * static renderer cannot evaluate that native chart's tslib dependency.
 */
export function Sparkline({ data = [], height = 36, color }: Props) {
  const [width, setWidth] = useState(0);
  const colors = useThemeColors();

  const segments = useMemo(() => {
    if (width <= 0 || data.length < 2) return [];
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - min) / range) * (height - 6) - 3,
    }));
    return points.slice(0, -1).map((point, index) => {
      const next = points[index + 1];
      const dx = next.x - point.x;
      const dy = next.y - point.y;
      return {
        x: point.x,
        y: point.y,
        width: Math.sqrt(dx * dx + dy * dy),
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      };
    });
  }, [data, height, width]);

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      accessibilityLabel={data.length > 1 ? 'Tendencia de precios' : 'Sin datos de tendencia'}
    >
      {segments.length > 0 ? (
        segments.map((segment, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                left: segment.x,
                top: segment.y,
                width: segment.width,
                backgroundColor: color ?? colors.orange,
                transform: [{ rotate: `${segment.angle}deg` }],
              },
            ]}
          />
        ))
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyLine, { backgroundColor: colors.line }]} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>Sin datos</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginTop: 12, overflow: 'hidden' },
  segment: {
    position: 'absolute',
    height: 2.5,
    borderRadius: 2,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyLine: { width: '100%', height: 1, position: 'absolute' },
  emptyText: { fontFamily: typography.medium, fontSize: 10 },
});
