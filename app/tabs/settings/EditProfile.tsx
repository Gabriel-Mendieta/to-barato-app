import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { clearSession, getAccessToken, getApiErrorMessage, getUserId } from '@/src/shared/api';
import { useCurrentUser, useUpdateUser } from '@/src/features/profile/hooks';
import { editProfileSchema, type EditProfileFormValues } from '@/src/features/profile/schema';
import type { UserDTO } from '@/src/shared/api/dto';
import { layout, radii, spacing, typography, useThemeColors } from '@/src/shared/theme';
import { Button, showToast, triggerHaptic } from '@/src/shared/ui';

export function getEditProfileFormWidth(width: number) {
  const preferredWidth =
    width >= layout.tabletBreakpoint ? width - layout.gutterWide * 2 : width * 0.72;
  return Math.min(layout.maxContentWidth, Math.max(280, preferredWidth));
}

function getFullName(user: UserDTO) {
  return [user.Nombres, user.Apellidos]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
}

function splitFullName(value: string, fallbackSurname: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { nombres: parts[0] ?? '', apellidos: fallbackSurname };
  }
  return { nombres: parts[0], apellidos: parts.slice(1).join(' ') };
}

type ProfileFieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
  testID: string;
};

function ProfileField({ label, error, testID, ...inputProps }: ProfileFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        accessibilityState={inputProps.editable === false ? { disabled: true } : undefined}
        placeholderTextColor={colors.muted}
        testID={testID}
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.line, color: colors.ink },
          focused && { borderColor: colors.navySoft, borderWidth: 2 },
          error && { borderColor: colors.red },
        ]}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    mode: 'onChange',
    defaultValues: {
      nombreUsuario: '',
      correo: '',
      telefono: '',
      nombres: '',
      apellidos: '',
    },
  });

  const userQuery = useCurrentUser(sessionUserId);
  const updateUserMutation = useUpdateUser(sessionUserId);
  const userData = userQuery.data;
  const loading = checkingSession || userQuery.isPending;
  const submitting = isSubmitting || updateUserMutation.isPending;

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const [token, userId] = await Promise.all([getAccessToken(), getUserId()]);
        if (!token || !userId) {
          await clearSession();
          router.replace('/auth/IniciarSesion');
          return;
        }
        if (mounted) setSessionUserId(userId);
      } catch {
        await clearSession();
        router.replace('/auth/IniciarSesion');
      } finally {
        if (mounted) setCheckingSession(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userData) return;
    reset({
      nombreUsuario: userData.NombreUsuario,
      correo: userData.Correo,
      telefono: userData.Telefono,
      nombres: getFullName(userData),
      apellidos: userData.Apellidos,
    });
  }, [reset, userData]);

  useEffect(() => {
    if (!userQuery.isError) return;
    void clearSession();
    showToast('error', t('profile.sessionExpired'), t('profile.sessionExpiredBody'));
    router.replace('/auth/IniciarSesion');
  }, [t, userQuery.isError]);

  const handleSave = handleSubmit(async (values) => {
    if (!userData) return;

    const payload: Partial<
      Pick<UserDTO, 'NombreUsuario' | 'Telefono' | 'Nombres' | 'Apellidos' | 'UrlPerfil'>
    > = {};
    const nextName = values.nombres.trim();

    if (nextName !== getFullName(userData)) {
      const { nombres, apellidos } = splitFullName(nextName, userData.Apellidos);
      payload.Nombres = nombres;
      payload.Apellidos = apellidos;
    }
    if (values.telefono.trim() !== userData.Telefono.trim()) {
      payload.Telefono = values.telefono.trim();
    }

    if (Object.keys(payload).length === 0) {
      showToast('info', t('profile.noChanges'), t('profile.noChangesBody'));
      return;
    }

    try {
      const updated = await updateUserMutation.mutateAsync(payload);
      reset({
        nombreUsuario: updated.NombreUsuario,
        correo: updated.Correo,
        telefono: updated.Telefono,
        nombres: getFullName(updated),
        apellidos: updated.Apellidos,
      });
      void triggerHaptic('success');
      showToast('success', t('profile.updated'));
      router.back();
    } catch (error) {
      void triggerHaptic('error');
      showToast(
        'error',
        t('profile.updateFailed'),
        getApiErrorMessage(error, t('profile.tryAgain')),
      );
    }
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.navy} />
      </SafeAreaView>
    );
  }

  if (!userData) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />
      <View style={[styles.header, { borderBottomColor: colors.line }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.back')}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          testID="edit-profile-back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.navySoft} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.navySoft }]}>
          {t('profile.editTitle')}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.form, { width: getEditProfileFormWidth(width) }]}>
            <Controller
              control={control}
              name="nombres"
              render={({ field: { onChange, onBlur, value } }) => (
                <ProfileField
                  label={t('profile.name')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder={t('profile.namePlaceholder')}
                  error={errors.nombres?.message ? t(errors.nombres.message) : undefined}
                  testID="edit-profile-name-input"
                />
              )}
            />
            <Controller
              control={control}
              name="correo"
              render={({ field: { value } }) => (
                <ProfileField
                  label={t('profile.email')}
                  value={value}
                  editable={false}
                  selectTextOnFocus={false}
                  error={errors.correo?.message ? t(errors.correo.message) : undefined}
                  testID="edit-profile-email-input"
                />
              )}
            />
            <Controller
              control={control}
              name="telefono"
              render={({ field: { onChange, onBlur, value } }) => (
                <ProfileField
                  label={t('profile.phone')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  placeholder={t('profile.phonePlaceholder')}
                  error={errors.telefono?.message ? t(errors.telefono.message) : undefined}
                  testID="edit-profile-phone-input"
                />
              )}
            />

            <View style={styles.saveRow}>
              <Button
                full={false}
                size="md"
                onPress={handleSave}
                disabled={submitting || !isDirty}
                loading={submitting}
                testID="edit-profile-save"
                style={styles.saveButton}
              >
                {t('profile.save')}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontFamily: typography.bold,
    fontSize: 24,
    letterSpacing: -0.4,
  },
  headerSide: { width: 44, height: 44 },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  pressed: { opacity: 0.72 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  form: {
    alignSelf: 'center',
    gap: spacing.lg,
  },
  field: { gap: spacing.xs },
  label: {
    fontFamily: typography.semibold,
    fontSize: 14,
    lineHeight: 18,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  error: {
    fontFamily: typography.medium,
    fontSize: typography.sizes.xs,
  },
  saveRow: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButton: {
    minWidth: 90,
    minHeight: 44,
  },
});
