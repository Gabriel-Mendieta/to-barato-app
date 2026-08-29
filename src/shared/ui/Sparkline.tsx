import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  data: number[];
  height?: number;
  color?: string;
};

/**
 * Lightweight area+line sparkline without react-native-svg (avoids native rebuild).
 * Segments are rotated Views between data points.
 */
export function Sparkline({
  data,
  height = 36,
  color = colors.orange,
}: Props) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const { segments, last } = useMemo(() => {
    if (width <= 0 || data.length < 2) {
      return { segments: [] as Segment[], last: null as Point | null };
    }
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pts: Point[] = data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - ((v - min) / range) * (height - 6) - 3,
    }));
    const segs: Segment[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      segs.push({ x: a.x, y: a.y, len, angle });
    }
    return { segments: segs, last: pts[pts.length - 1] };
  }, [data, width, height]);

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout}>
      {segments.map((s, i) => (
        <View
          key={i}
          style={[
            styles.seg,
            {
              left: s.x,
              top: s.y,
              width: s.len,
              backgroundColor: color,
              transform: [{ rotate: `${s.angle}deg` }],
            },
          ]}
        />
      ))}
      {last ? (
        <View
          style={[
            styles.dot,
            {
              left: last.x - 4,
              top: last.y - 4,
              backgroundColor: color,
              borderColor: '#fff',
            },
          ]}
        />
      ) : null}
    </View>
  );
}

type Point = { x: number; y: number };
type Segment = { x: number; y: number; len: number; angle: number };

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 12,
    overflow: 'hidden',
  },
  seg: {
    position: 'absolute',
    height: 2.5,
    borderRadius: 2,
    // RN rotates around center; nudge with translate so left edge anchors better
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
});
