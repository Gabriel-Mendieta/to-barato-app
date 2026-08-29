import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetModalMethods,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from './BottomSheetCompat';
import { api, endpoints } from '@/src/shared/api';
import { colors, typography, useThemeColors } from '@/src/shared/theme';
import { Button } from './Button';
import { triggerHaptic } from './haptics';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createListSchema, type CreateListFormValues } from '@/src/features/lists/schema';

export type TipoProveedorOption = {
  IdTipoProveedor: number;
  NombreTipoProveedor: string;
};

export type CreateListPayload = {
  tipo: TipoProveedorOption;
  nombre: string;
};

const PASTEL_PALETTE = [
  '#FFE8D9',
  '#E3EDFA',
  '#F1E7FA',
  '#DCF3E7',
  '#FFF1C8',
  '#FFE3E1',
  '#E2F1FA',
  '#FFEACB',
  '#E6E7EA',
] as const;

function tipoEmoji(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes('farmac')) return '💊';
  if (n.includes('ferret') || n.includes('hardware')) return '🛠️';
  if (n.includes('super') || n.includes('mercado') || n.includes('market')) return '🛒';
  return '🏪';
}

function tipoTint(nombre: string, index: number): string {
  const n = nombre.toLowerCase();
  if (n.includes('farmac')) return '#FFE3E1';
  if (n.includes('ferret') || n.includes('hardware')) return '#E6E7EA';
  if (n.includes('super') || n.includes('mercado') || n.includes('market')) return '#E2F1FA';
  return PASTEL_PALETTE[index % PASTEL_PALETTE.length];
}

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called after tipo + custom name are confirmed. */
  onConfirm: (payload: CreateListPayload) => void | Promise<void>;
  /** @deprecated Prefer onConfirm — kept for gradual migration. */
  onSelect?: (tipo: TipoProveedorOption) => void;
};

export function CreateListModal({ visible, onClose, onConfirm, onSelect }: Props) {
  const themeColors = useThemeColors();
  const sheetRef = useRef<BottomSheetModalMethods>(null);
  const nameInputRef = useRef<React.ElementRef<typeof BottomSheetTextInput>>(null);
  const [tipos, setTipos] = useState<TipoProveedorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'tipo' | 'nombre'>('tipo');
  const [selected, setSelected] = useState<TipoProveedorOption | null>(null);
  const {
    control,
    handleSubmit,
    reset: resetForm,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateListFormValues>({
    resolver: zodResolver(createListSchema),
    mode: 'onChange',
    defaultValues: { nombre: '' },
  });

  const reset = useCallback(() => {
    setStep('tipo');
    setSelected(null);
    resetForm({ nombre: '' });
    setError(null);
  }, [resetForm]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<TipoProveedorOption[]>(endpoints.tipoproveedor);
      setTipos(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar las categorías.');
      setTipos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      reset();
      load();
      requestAnimationFrame(() => sheetRef.current?.present());
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible, load, reset]);

  useEffect(() => {
    if (!visible || step !== 'nombre') return;
    const t = setTimeout(() => nameInputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [visible, step]);

  const pickTipo = (t: TipoProveedorOption) => {
    void triggerHaptic('selection');
    setSelected(t);
    resetForm({ nombre: t.NombreTipoProveedor });
    void trigger('nombre');
    setStep('nombre');
  };

  const handleConfirm = handleSubmit(async ({ nombre }) => {
    if (!selected) return;
    void triggerHaptic('success');
    await onConfirm({ tipo: selected, nombre });
    if (onSelect) onSelect(selected);
  });

  const cols = Math.min(3, Math.max(1, tipos.length));
  const cellPct = `${100 / cols}%` as `${number}%`;
  const canContinue = Boolean(selected && isValid);

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={['92%']}
      enablePanDownToClose
      onDismiss={onClose}
      topInset={12}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={(props: Record<string, unknown>) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      backgroundStyle={{ backgroundColor: themeColors.card }}
      handleIndicatorStyle={{ backgroundColor: themeColors.line }}
    >
      <View style={[styles.sheet, { paddingBottom: 28 }]}>
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          {step === 'nombre' ? (
            <Pressable
              onPress={() => setStep('tipo')}
              style={styles.backRow}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Volver a categorías"
            >
              <Ionicons name="chevron-back" size={18} color={colors.navy} />
              <Text style={styles.backText}>Categoría</Text>
            </Pressable>
          ) : null}

          <Text style={styles.title}>Nueva lista</Text>
          <Text style={styles.subtitle}>
            {step === 'tipo'
              ? 'Elige una categoría para empezar.'
              : `Nombre para tu lista de ${selected?.NombreTipoProveedor ?? ''}.`}
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.navy} style={{ marginVertical: 28 }} />
          ) : error && step === 'tipo' ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={load} hitSlop={8}>
                <Text style={styles.retry}>Reintentar</Text>
              </Pressable>
            </View>
          ) : step === 'tipo' ? (
            tipos.length === 0 ? (
              <Text style={styles.empty}>No hay categorías disponibles.</Text>
            ) : (
              <View style={styles.grid}>
                {tipos.map((t, i) => (
                  <View key={t.IdTipoProveedor} style={[styles.cellOuter, { width: cellPct }]}>
                    <Pressable
                      onPress={() => pickTipo(t)}
                      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                      accessibilityRole="button"
                      accessibilityLabel={t.NombreTipoProveedor}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: tipoTint(t.NombreTipoProveedor, i),
                          },
                        ]}
                      >
                        <Text style={styles.emoji}>{tipoEmoji(t.NombreTipoProveedor)}</Text>
                      </View>
                      <Text style={styles.cardLabel} numberOfLines={2}>
                        {t.NombreTipoProveedor}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )
          ) : (
            <View style={styles.nameBlock}>
              <Text style={styles.fieldLabel}>Nombre de la lista</Text>
              <Controller
                control={control}
                name="nombre"
                render={({ field: { onChange, onBlur, value } }) => (
                  <BottomSheetTextInput
                    ref={nameInputRef}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ej. Compras de la semana"
                    placeholderTextColor={colors.muted}
                    style={[styles.nameInput, errors.nombre && styles.nameInputError]}
                    maxLength={60}
                    returnKeyType="done"
                    onSubmitEditing={() => void handleConfirm()}
                  />
                )}
              />
              {errors.nombre ? (
                <Text style={styles.inlineError} accessibilityRole="alert">
                  {errors.nombre.message}
                </Text>
              ) : null}
            </View>
          )}
        </BottomSheetScrollView>

        <View style={styles.actions}>
          {step === 'nombre' ? (
            <Button
              tone="orange"
              onPress={handleConfirm}
              disabled={!canContinue || isSubmitting}
              loading={isSubmitting}
            >
              Continuar
            </Button>
          ) : null}
          <Button tone="navy" onPress={() => sheetRef.current?.dismiss()} disabled={isSubmitting}>
            Cancelar
          </Button>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const ICON_SIZE = 85;

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.card,
    paddingHorizontal: 18,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: typography.semibold,
    fontSize: 13,
    color: colors.navy,
  },
  title: {
    fontFamily: typography.extrabold,
    fontSize: 18,
    color: colors.navy,
  },
  subtitle: {
    fontFamily: typography.medium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 12,
    marginHorizontal: -5,
  },
  cellOuter: {
    padding: 15,
  },
  card: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(11,37,69,0.08)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  cardPressed: {
    opacity: 0.88,
    backgroundColor: '#F7F8FC',
  },
  iconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Math.round(ICON_SIZE * 0.32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: ICON_SIZE * 0.55,
    lineHeight: ICON_SIZE * 0.55,
    textAlign: 'center',
  },
  cardLabel: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: colors.ink,
    textAlign: 'center',
  },
  nameBlock: {
    marginTop: 16,
    gap: 8,
  },
  fieldLabel: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: colors.navy,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  nameInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: typography.medium,
    fontSize: 15,
    color: colors.ink,
  },
  nameInputError: {
    borderColor: colors.red,
  },
  inlineError: {
    fontFamily: typography.medium,
    fontSize: 12,
    color: colors.red,
  },
  actions: {
    marginTop: 18,
    gap: 10,
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  errorText: {
    fontFamily: typography.medium,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  retry: {
    fontFamily: typography.bold,
    fontSize: 13,
    color: colors.orangeDeep,
  },
  empty: {
    fontFamily: typography.medium,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
