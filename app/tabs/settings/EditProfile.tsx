import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  type ColorSchemeName,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { clearSession, getAccessToken, getApiErrorMessage, getUserId } from '@/src/shared/api';
import { useCurrentUser, useUpdateUser } from '@/src/features/profile/hooks';
import { editProfileSchema, type EditProfileFormValues } from '@/src/features/profile/schema';
import type { UserDTO } from '@/src/shared/api/dto';
import { layout, radii, spacing, typography, useThemeColors } from '@/src/shared/theme';
import { Button, showToast, triggerHaptic } from '@/src/shared/ui';

/**
 * `colors.navy` flips to a light blue in dark mode, so the badge icon and ring
 * have to flip with it or the pencil turns white-on-light-blue.
 */
export function getAvatarEditBadgeColors(
  palette: { navy: string; white: string; bg: string },
  colorScheme: ColorSchemeName,
) {
  const contrast = colorScheme === 'dark' ? palette.bg : palette.white;
  return { background: palette.navy, border: contrast, icon: contrast };
}

export function getEditProfileFormWidth(width: number) {
  const preferredWidth =
    width >= layout.tabletBreakpoint ? width - layout.gutterWide * 2 : width - layout.gutter * 2;
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

function getInitials(fullName: string) {
  return (
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

type IconButtonProps = {
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
  testID: string;
  hitSlop?: number;
  style: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * NativeWind's JSX runtime swaps every `Pressable` for a cssInterop wrapper that
 * flattens `style` into a plain object. A `({ pressed }) => [...]` callback
 * flattens to `{}`, so the button reaches the native side with no size, fill or
 * position — invisible. Static arrays survive, so the pressed state lives here.
 */
function IconButton({
  accessibilityLabel,
  accessibilityHint,
  onPress,
  testID,
  hitSlop,
  style,
  children,
}: IconButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hitSlop={hitSlop}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[style, pressed ? styles.pressed : null]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

type ProfileFieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  hint?: string;
  error?: string;
  testID: string;
};

function ProfileField({ label, hint, error, testID, ...inputProps }: ProfileFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.navy }]}>{label}</Text>
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
      {hint ? <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default function EditProfileScreen() {
  const { t } = useTranslation('translation');
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
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

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('error', t('profile.permissionDenied'), t('profile.photoPermissionBody'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      setAvatarImageFailed(false);
      setSelectedAvatarUri(result.assets[0].uri);
      showToast('info', t('profile.photoSelected'), t('profile.photoSelectedBody'));
    } catch {
      showToast('error', t('profile.photoPickerFailed'), t('profile.tryAgain'));
    }
  };

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
    if (selectedAvatarUri && selectedAvatarUri !== userData.UrlPerfil) {
      payload.UrlPerfil = selectedAvatarUri;
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

  const fullName = getFullName(userData);
  const initials = getInitials(fullName);
  const avatarUri = selectedAvatarUri ?? userData.UrlPerfil;
  const badgeColors = getAvatarEditBadgeColors(colors, colorScheme);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bg }]}
      testID="edit-profile-screen"
    >
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />
      <View style={styles.header}>
        <IconButton
          accessibilityLabel={t('profile.back')}
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.line }]}
          testID="edit-profile-back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </IconButton>
        <Text style={[styles.headerTitle, { color: colors.navy }]}>{t('profile.editTitle')}</Text>
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
          <View style={[styles.content, { width: getEditProfileFormWidth(width) }]}>
            <View style={styles.avatarSection}>
              <View
                accessibilityLabel={initials}
                style={styles.avatarFrame}
                testID="edit-profile-avatar-wrapper"
              >
                {avatarUri && !avatarImageFailed ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatar}
                    testID="edit-profile-avatar-image"
                    accessibilityLabel={initials}
                    onError={() => setAvatarImageFailed(true)}
                  />
                ) : (
                  <LinearGradient
                    colors={['#F2A03D', '#E97C2A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.avatar, styles.avatarFallback]}
                    testID="edit-profile-avatar"
                    accessibilityLabel={initials}
                  >
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </LinearGradient>
                )}
                {/* Rendered after the avatar so it paints on top of it. */}
                <IconButton
                  accessibilityLabel={t('profile.editPhoto')}
                  accessibilityHint={t('profile.editPhotoHint')}
                  hitSlop={8}
                  onPress={() => void handlePickAvatar()}
                  style={[
                    styles.avatarEditButton,
                    { backgroundColor: badgeColors.background, borderColor: badgeColors.border },
                  ]}
                  testID="edit-profile-avatar-button"
                >
                  <Ionicons name="pencil" size={20} color={badgeColors.icon} />
                </IconButton>
              </View>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="nombres"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ProfileField
                    label={t('profile.name')}
                    hint={t('profile.nameHint')}
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
                    hint={t('profile.emailHint')}
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
                    hint={t('profile.phoneHint')}
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
                  onPress={handleSave}
                  disabled={submitting}
                  loading={submitting}
                  testID="edit-profile-save"
                  style={styles.saveButton}
                >
                  {t('profile.saveChanges')}
                </Button>
              </View>
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
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontFamily: typography.extrabold,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  headerSide: { width: 44, height: 44 },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    shadowColor: '#0B2545',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pressed: { opacity: 0.72 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  content: {
    alignSelf: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  avatarFrame: {
    width: 112,
    height: 112,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: radii.pill,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C97A1A',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  avatarInitials: {
    color: '#fff',
    fontFamily: typography.extrabold,
    fontSize: 36,
  },
  avatarEditButton: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#06182D',
    shadowOpacity: 0.32,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  form: {
    gap: spacing.md,
  },
  field: { gap: 6 },
  label: {
    fontFamily: typography.bold,
    fontSize: typography.sizes.xs,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  hint: {
    fontFamily: typography.family,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.semibold,
    fontSize: 16,
    lineHeight: 22,
    shadowColor: '#0B2545',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  error: {
    fontFamily: typography.medium,
    fontSize: typography.sizes.xs,
  },
  saveRow: {
    marginTop: spacing.xs,
  },
  saveButton: {
    minHeight: 54,
  },
});
