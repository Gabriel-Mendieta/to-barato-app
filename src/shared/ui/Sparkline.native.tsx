import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { typography, useThemeColors } from '../theme';

type Props = {
  data?: number[];
  labels?: string[];
  height?: number;
  color?: string;
};

export function Sparkline({ data = [], labels = [], height = 36, color }: Props) {
  const [width, setWidth] = useState(0);
  const colors = useThemeColors();
  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      accessibilityLabel={data.length > 1 ? 'Tendencia de precios' : 'Sin datos de tendencia'}
    >
      {data.length > 1 && width > 0 ? (
        <LineChart
          data={data.map((value, index) => ({
            value,
            label: labels[index] ?? '',
          }))}
          width={width}
          height={height}
          color={color ?? colors.orange}
          thickness={2}
          hideAxesAndRules
          hideYAxisText
          isAnimated
          areaChart
          startFillColor={color ?? colors.orange}
          endFillColor={color ?? colors.orange}
          startOpacity={0.28}
          endOpacity={0.02}
          dataPointsColor={color ?? colors.orange}
          dataPointsRadius={2}
          initialSpacing={2}
          endSpacing={2}
          yAxisThickness={0}
          xAxisThickness={0}
          noOfSections={2}
        />
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyLine: { width: '100%', height: 1, position: 'absolute' },
  emptyText: { fontFamily: typography.medium, fontSize: 10 },
});
