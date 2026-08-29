import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { parseRecipeMarkdown } from '@/src/features/recipes/parseRecipe';
import { Button, Chip, Screen, ScreenTitle } from '@/src/shared/ui';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

export default function IaResultScreen() {
  const { reply } = useLocalSearchParams<{ reply: string }>();
  const router = useRouter();
  const raw = decodeURIComponent(reply || '');
  const recipe = useMemo(() => parseRecipeMarkdown(raw), [raw]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Chip tone="orange" size="sm">
          IA · parseado en cliente
        </Chip>
        <ScreenTitle>{recipe.title}</ScreenTitle>

        {recipe.ingredients.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.heading}>Ingredientes</Text>
            {recipe.ingredients.map((ing, idx) => (
              <View key={`${ing.name}-${idx}`} style={styles.row}>
                <View style={styles.bullet} />
                <Text style={styles.rowText}>
                  {ing.quantity ? `${ing.quantity} · ` : ''}
                  {ing.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {recipe.steps.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.heading}>Pasos</Text>
            {recipe.steps.map((step) => (
              <View key={step.order} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{step.order}</Text>
                </View>
                <Text style={styles.rowText}>{step.text}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.block}>
            <Text style={styles.heading}>Respuesta</Text>
            <Text style={styles.raw}>{recipe.raw || 'Sin contenido'}</Text>
          </View>
        )}
      </ScrollView>
      <Button tone="navy" onPress={() => router.push('/tabs/lista')}>
        Cerrar
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, gap: spacing.md },
  block: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.sm,
  },
  heading: {
    fontFamily: typography.extrabold,
    fontSize: 16,
    color: colors.navy,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
    marginTop: 6,
  },
  rowText: {
    flex: 1,
    fontFamily: typography.family,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: colors.white,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  raw: {
    fontFamily: typography.family,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
  },
});
