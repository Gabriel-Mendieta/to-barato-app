import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRequestOtp } from '@/src/features/auth/hooks';
import { registerSchema, type RegisterFormValues } from '@/src/features/auth/schema';
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field, Screen, showToast, triggerHaptic } from '@/src/shared/ui';
import { colors, spacing, typography } from '@/src/shared/theme';

function splitDisplayName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : firstName;
  return { firstName, lastName };
}

function usernameFrom(email: string, displayName: string) {
  const fromEmail = email.split('@')[0]?.replace(/[^a-zA-Z0-9._]/g, '') ?? '';
  if (fromEmail.length >= 3) return fromEmail.toLowerCase();
  const fromName = displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._]/g, '');
  return fromName || 'usuario';
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { requestOtp, loading: sendingOtp, error: otpError } = useRequestOtp();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { name: '', email: '', password: '' },
  });

  const handleRegister = handleSubmit(async ({ name, email, password }) => {
    const { firstName, lastName } = splitDisplayName(name);
    const username = usernameFrom(email, name);

    const response = await requestOtp(email);
    if (response) {
      void triggerHaptic('success');
      router.push({
        pathname: '/auth/Otp',
        params: {
          data: encodeURIComponent(
            JSON.stringify({ firstName, lastName, username, email, password }),
          ),
        },
      });
    } else {
      void triggerHaptic('error');
      showToast('error', 'No se pudo continuar', otpError ?? 'Intenta nuevamente.');
    }
  });

  return (
    <Screen edges={['top', 'bottom']} gutters>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <Image
                source={require('../../assets/icons/logo.png')}
                resizeMode="contain"
                style={styles.logo}
                tintColor={colors.orange}
                accessibilityIgnoresInvertColors
              />
              <Text style={styles.brand}>
                To'<Text style={styles.brandAccent}>Barato</Text>
              </Text>
            </View>

            <View style={styles.body}>
              <Text style={styles.title}>Crea tu cuenta gratis.</Text>
              <Text style={styles.subtitle}>Empieza a comparar precios y ahorrar hoy.</Text>

              <View style={styles.form}>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Field
                      label="Nombre"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Mario Luciano"
                      autoCapitalize="words"
                      textContentType="name"
                      hint="Como aparecerá en tu perfil"
                    />
                  )}
                />
                {errors.name ? (
                  <Text style={styles.errorText} accessibilityRole="alert">
                    {errors.name.message}
                  </Text>
                ) : null}
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Field
                      label="Correo electrónico"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="mario.luciano@gmail.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="emailAddress"
                    />
                  )}
                />
                {errors.email ? (
                  <Text style={styles.errorText} accessibilityRole="alert">
                    {errors.email.message}
                  </Text>
                ) : null}
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Field
                      label="Contraseña"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="••••••••••"
                      secureTextEntry={!passwordVisible}
                      textContentType="newPassword"
                      autoCapitalize="none"
                      trailing={
                        <Pressable
                          onPress={() => setPasswordVisible((v) => !v)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={
                            passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                          }
                        >
                          <Ionicons
                            name={passwordVisible ? 'eye' : 'eye-off'}
                            size={20}
                            color={colors.muted}
                          />
                        </Pressable>
                      }
                    />
                  )}
                />
                {errors.password ? (
                  <Text style={styles.errorText} accessibilityRole="alert">
                    {errors.password.message}
                  </Text>
                ) : null}

                {otpError ? (
                  <Text style={styles.errorText} accessibilityRole="alert">
                    {otpError}
                  </Text>
                ) : null}

                <Button
                  tone="navy"
                  size="lg"
                  onPress={handleRegister}
                  loading={sendingOtp}
                  disabled={!isValid || sendingOtp}
                >
                  Registrarse
                </Button>

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/IniciarSesion')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.link}> Iniciar sesión</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    gap: spacing.md,
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: 28,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 168,
    overflow: 'hidden',
    position: 'relative',
    gap: spacing.sm,
  },
  heroGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
    backgroundColor: colors.navySoft,
    opacity: 0.45,
  },
  logo: {
    width: 56,
    height: 72,
    zIndex: 1,
  },
  brand: {
    fontFamily: typography.extrabold,
    fontSize: 28,
    color: colors.white,
    letterSpacing: -0.4,
    zIndex: 1,
  },
  brandAccent: { color: colors.orange },
  body: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  title: {
    fontFamily: typography.extrabold,
    fontSize: 24,
    color: colors.navy,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: typography.family,
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  form: { gap: spacing.md },
  errorText: {
    fontFamily: typography.family,
    color: colors.red,
    fontSize: 12,
    marginTop: -spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  footerText: {
    fontFamily: typography.family,
    color: colors.ink,
    fontSize: 13,
  },
  link: {
    fontFamily: typography.extrabold,
    color: colors.orangeDeep,
    fontSize: 13,
  },
});
