import {
  api,
  endpoints,
  clearSession,
  getAccessToken,
  getUserId,
  getApiErrorMessage,
  saveSession,
} from '@/src/shared/api';
import type { LoginResponse } from '@/src/shared/api/dto';
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
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
import { Button, Field, Screen } from '@/src/shared/ui';
import { colors, spacing, typography } from '@/src/shared/theme';
import { initDevMode, isOfflineMode, setOfflineMode } from '@/src/shared/dev';

async function validateSessionOrClear(): Promise<boolean> {
  const storedToken = await getAccessToken();
  const storedUserId = await getUserId();
  if (!storedToken || !storedUserId) return false;
  try {
    await api.get(endpoints.usuario(storedUserId));
    return true;
  } catch {
    await clearSession();
    return false;
  }
}

export default function IniciarSesion() {
  const insets = useSafeAreaInsets();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [checkingToken, setCheckingToken] = useState(true);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

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
      const valid = await validateSessionOrClear();
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
      promptMessage: 'Iniciar sesión con biometría',
      fallbackLabel: 'Usar contraseña',
    });

    if (!resultado.success) {
      Alert.alert('Autenticación fallida', 'Puedes usar tu contraseña.');
      return;
    }

    const valid = await validateSessionOrClear();
    if (valid) {
      router.replace('/tabs/home');
    } else {
      Alert.alert(
        'Sesión requerida',
        'Inicia sesión con tu correo y contraseña para activar la biometría.'
      );
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Debes ingresar correo y contraseña');
    }
    setLoading(true);
    try {
      const resp = await api.post<LoginResponse>(endpoints.login, {
        Correo: email,
        Clave: password,
      });

      const {
        tokens: { access_token, refresh_token },
        usuario,
      } = resp.data;

      await saveSession({
        accessToken: access_token,
        refreshToken: refresh_token,
        userId: usuario.id.toString(),
      });
      router.replace('/tabs/home');
    } catch (err) {
      Alert.alert('Login fallido', getApiErrorMessage(err, 'Credenciales incorrectas'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleStub = () => {
    Alert.alert(
      'Próximamente',
      'Continuar con Google estará disponible pronto.'
    );
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
              <Text style={styles.tagline}>Compara, ahorra, y come rico.</Text>
            </View>

            <View style={styles.body}>
              {__DEV__ ? (
                <View style={styles.devBanner}>
                  <Text style={styles.devLabel}>Modo desarrollo</Text>
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
                  <Text style={styles.devHint}>
                    Offline usa datos mock RD$ con latencia simulada.
                  </Text>
                </View>
              ) : null}

              <Text style={styles.title}>
                Ayuda a tu bolsillo{'\n'}
                <Text style={styles.titleAccent}>con nosotros.</Text>
              </Text>
              <Text style={styles.subtitle}>
                Inicia sesión para ver los mejores precios cerca de ti.
              </Text>

              <View style={styles.form}>
                <Field
                  label="Correo o teléfono"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Ingresa tu correo"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                />
                <Field
                  label="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ingresa tu contraseña"
                  secureTextEntry={!passwordVisible}
                  textContentType="password"
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

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Próximamente',
                      'Recuperación de contraseña aún no está disponible en la API.'
                    )
                  }
                  style={styles.forgot}
                  accessibilityRole="button"
                >
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>

                <Button tone="navy" size="lg" onPress={handleLogin} loading={loading}>
                  Iniciar sesión
                </Button>

                <Button tone="light" onPress={verificarBiometria}>
                  <Ionicons name="finger-print" size={20} color={colors.navy} />
                  <Text style={styles.secondaryLabel}>Usar biometría</Text>
                </Button>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o continúa con</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button tone="light" onPress={handleGoogleStub}>
                  <Ionicons name="logo-google" size={20} color={colors.ink} />
                  <Text style={styles.secondaryLabel}>Continuar con Google</Text>
                </Button>

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>¿No tienes cuenta?</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/RegisterScreen')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.link}> Regístrate</Text>
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
