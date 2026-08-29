import { validateStoredSession } from '@/src/features/auth/api';
import { useLogin } from '@/src/features/auth/hooks';
import { getApiErrorMessage } from '@/src/shared/api';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field, Screen, showToast, triggerHaptic } from '@/src/shared/ui';
import { colors, spacing, typography } from '@/src/shared/theme';
import { initDevMode, isOfflineMode, setOfflineMode } from '@/src/shared/dev';
import { useTranslation } from 'react-i18next';

export default function IniciarSesion() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [checkingToken, setCheckingToken] = useState(true);
  const [offline, setOffline] = useState(false);
  const { login, loading, error: loginError } = useLogin();

  useEffect(() => {
    if (__DEV__) {
      initDevMode().then(() => setOffline(isOfflineMode()));
    }
  }, []);

  const handleDevModeChange = async (nextOffline: boolean) => {
    await setOfflineMode(nextOffline);
    setOffline(nextOffline);
  };

  useEffect(() => {
    (async () => {
      const valid = await validateStoredSession();
      if (valid) {
        router.replace('/tabs/home');
        return;
      }
      setCheckingToken(false);
    })();
  }, []);

  if (checkingToken) return null;

  const verificarBiometria = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const registrado = await LocalAuthentication.isEnrolledAsync();
    if (!(compatible && registrado)) return;

    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: t('auth.login.biometricPrompt'),
      fallbackLabel: t('auth.login.biometricFallback'),
    });

    if (!resultado.success) {
      void triggerHaptic('error');
      showToast('error', t('auth.login.biometricFailed'), t('auth.login.biometricFailedBody'));
      return;
    }

    const valid = await validateStoredSession();
    if (valid) {
      router.replace('/tabs/home');
    } else {
      showToast('info', t('auth.login.sessionRequired'), t('auth.login.sessionRequiredBody'));
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      void triggerHaptic('error');
      showToast('error', t('auth.login.incomplete'), t('auth.login.incompleteBody'));
      return;
    }
    try {
      await login({
        Correo: email,
        Clave: password,
      });
      void triggerHaptic('success');
      router.replace('/tabs/home');
    } catch (error) {
      void triggerHaptic('error');
      showToast(
        'error',
        t('auth.login.loginFailed'),
        getApiErrorMessage(error, loginError ?? t('auth.login.invalidCredentials')),
      );
    }
  };

  const handleGoogleStub = () => {
    showToast('info', t('auth.login.comingSoon'), t('auth.login.googleComingSoon'));
  };

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
              <Text style={styles.brand}>
                To'<Text style={styles.brandAccent}>Barato</Text>
              </Text>
              <Text style={styles.tagline}>{t('auth.login.tagline')}</Text>
            </View>

            <View style={styles.body}>
              {__DEV__ ? (
                <View style={styles.devBanner}>
                  <Text style={styles.devLabel}>{t('auth.login.devMode')}</Text>
                  <View style={styles.devToggle}>
                    <Pressable
                      style={[styles.devOption, !offline && styles.devOptionActive]}
                      onPress={() => handleDevModeChange(false)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: !offline }}
                    >
                      <Text style={[styles.devOptionText, !offline && styles.devOptionTextActive]}>
                        Online
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.devOption, offline && styles.devOptionActive]}
                      onPress={() => handleDevModeChange(true)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: offline }}
                    >
                      <Text style={[styles.devOptionText, offline && styles.devOptionTextActive]}>
                        Offline
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={styles.devHint}>{t('auth.login.offlineHint')}</Text>
                </View>
              ) : null}

              <Text style={styles.title}>
                {t('auth.login.title')}
                {'\n'}
                <Text style={styles.titleAccent}>{t('auth.login.titleAccent')}</Text>
              </Text>
              <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

              <View style={styles.form}>
                <Field
                  label={t('auth.login.emailLabel')}
                  testID="login-email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.login.emailPlaceholder')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                />
                <Field
                  label={t('auth.login.passwordLabel')}
                  testID="login-password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  secureTextEntry={!passwordVisible}
                  textContentType="password"
                  trailing={
                    <Pressable
                      onPress={() => setPasswordVisible((v) => !v)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        passwordVisible
                          ? t('auth.login.hidePassword')
                          : t('auth.login.showPassword')
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

                <TouchableOpacity
                  onPress={() =>
                    showToast(
                      'info',
                      t('auth.login.comingSoon'),
                      t('auth.login.recoveryUnavailable'),
                    )
                  }
                  style={styles.forgot}
                  accessibilityRole="button"
                >
                  <Text style={styles.forgotText}>{t('auth.login.forgotPassword')}</Text>
                </TouchableOpacity>

                <Button
                  tone="navy"
                  size="lg"
                  onPress={handleLogin}
                  loading={loading}
                  testID="login-submit"
                >
                  {t('auth.login.login')}
                </Button>

                <Button tone="light" onPress={verificarBiometria}>
                  <Ionicons name="finger-print" size={20} color={colors.navy} />
                  <Text style={styles.secondaryLabel}>{t('auth.login.biometrics')}</Text>
                </Button>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('auth.login.continueWith')}</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button tone="light" onPress={handleGoogleStub}>
                  <Ionicons name="logo-google" size={20} color={colors.ink} />
                  <Text style={styles.secondaryLabel}>{t('auth.login.google')}</Text>
                </Button>

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>{t('auth.login.noAccount')}</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/RegisterScreen')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.link}> {t('auth.login.register')}</Text>
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
  brand: {
    fontFamily: typography.extrabold,
    fontSize: 30,
    color: colors.white,
    letterSpacing: -0.4,
    zIndex: 1,
  },
  brandAccent: { color: colors.orange },
  tagline: {
    marginTop: spacing.sm,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: typography.medium,
    fontSize: 12,
    zIndex: 1,
  },
  body: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  title: {
    fontFamily: typography.extrabold,
    fontSize: 26,
    color: colors.navy,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  titleAccent: { color: colors.orange },
  subtitle: {
    fontFamily: typography.family,
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  form: { gap: spacing.md },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.xs },
  forgotText: {
    color: colors.orangeDeep,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  secondaryLabel: {
    fontFamily: typography.semibold,
    fontSize: 14,
    color: colors.navy,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
  dividerText: {
    fontFamily: typography.family,
    fontSize: 11,
    color: colors.muted,
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
  devBanner: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0D78C',
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  devLabel: {
    fontFamily: typography.semibold,
    fontSize: 11,
    color: '#8A6D1D',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  devToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E8DFC0',
  },
  devOption: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  devOptionActive: {
    backgroundColor: colors.navy,
  },
  devOptionText: {
    fontFamily: typography.semibold,
    fontSize: 12,
    color: colors.muted,
  },
  devOptionTextActive: {
    color: colors.white,
  },
  devHint: {
    fontFamily: typography.family,
    fontSize: 10,
    color: colors.muted,
  },
});
