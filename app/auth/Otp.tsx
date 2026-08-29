import { api, endpoints, getApiErrorMessage } from '@/src/shared/api';
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Screen } from '@/src/shared/ui';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const OTP_LENGTH = 6;

export default function OtpVerificationScreen() {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  const [timer, setTimer] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState('');

  const params = useLocalSearchParams<{ data?: string }>();
  const raw = params.data ?? '';
  const formData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
  } = raw
    ? JSON.parse(decodeURIComponent(raw))
    : {
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
      };

  useEffect(() => {
    if (timer > 0) {
      const id = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [timer]);

  const applyDigits = (digits: string[], startIndex = 0) => {
    const capped = digits.slice(0, OTP_LENGTH - startIndex);
    const lastFilled = startIndex + capped.length - 1;
    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < capped.length; i++) {
        next[startIndex + i] = capped[i];
      }
      return next;
    });
    const focusAt = Math.min(Math.max(lastFilled + 1, 0), OTP_LENGTH - 1);
    requestAnimationFrame(() => {
      inputsRef.current[focusAt]?.focus();
      setFocusedIndex(focusAt);
    });
  };

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');

    // Paste: fill from current box onward
    if (cleaned.length > 1) {
      applyDigits(cleaned.slice(0, OTP_LENGTH - index).split(''), index);
      return;
    }

    const digit = cleaned.slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    // Solo cuando la caja está vacía: ir a la anterior y borrarla.
    // Si hay dígito, onChangeText("") lo limpia.
    if (e.nativeEvent.key !== 'Backspace' || otp[index] !== '' || index === 0) {
      return;
    }
    setOtp((prev) => {
      const next = [...prev];
      next[index - 1] = '';
      return next;
    });
    inputsRef.current[index - 1]?.focus();
    setFocusedIndex(index - 1);
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) return;

    setVerifyError('');
    setVerifying(true);
    try {
      await api.post(endpoints.verificarOtp, null, {
        params: { email: formData.email, codigo: code },
      });
      router.replace({
        pathname: '/auth/Profile-setup',
        params: {
          data: encodeURIComponent(JSON.stringify(formData)),
        },
      });
    } catch (err) {
      setVerifyError(
        getApiErrorMessage(err, 'Código incorrecto o expirado. Intenta de nuevo.')
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResendError('');
    setResending(true);
    try {
      await api.post(endpoints.solicitarOtp, null, {
        params: { email: formData.email },
      });
      setTimer(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
      setFocusedIndex(0);
    } catch (err) {
      setResendError(getApiErrorMessage(err, 'No se pudo reenviar. Intenta más tarde.'));
    } finally {
      setResending(false);
    }
  };

  const codeComplete = otp.every((d) => d !== '');

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
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                style={styles.backBtn}
              >
                <Ionicons name="chevron-back" size={22} color={colors.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <Text style={styles.brand}>
                To'<Text style={styles.brandAccent}>Barato</Text>
              </Text>
              <Text style={styles.tagline}>Un paso más para crear tu cuenta</Text>
            </View>

            <View style={styles.body}>
              <Text style={styles.title}>Verifica tu correo</Text>
              <Text style={styles.subtitle}>
                Ingresa el código de {OTP_LENGTH} dígitos que enviamos a{' '}
                <Text style={styles.emailHighlight}>
                  {formData.email || 'tu correo'}
                </Text>
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => {
                  const focused = focusedIndex === i;
                  return (
                    <TextInput
                      key={i}
                      ref={(el) => {
                        inputsRef.current[i] = el;
                      }}
                      value={digit}
                      onChangeText={(v) => handleChange(i, v)}
                      onKeyPress={(e) => handleKeyPress(i, e)}
                      onFocus={() => setFocusedIndex(i)}
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      autoComplete="sms-otp"
                      maxLength={OTP_LENGTH}
                      selectTextOnFocus
                      style={[
                        styles.otpBox,
                        focused && styles.otpBoxFocused,
                        digit !== '' && styles.otpBoxFilled,
                      ]}
                      accessibilityLabel={`Dígito ${i + 1} de ${OTP_LENGTH}`}
                    />
                  );
                })}
              </View>

              {verifyError.length > 0 ? (
                <Text style={styles.errorText}>{verifyError}</Text>
              ) : null}

              <Button
                tone="navy"
                size="lg"
                onPress={handleVerify}
                loading={verifying}
                disabled={!codeComplete}
              >
                Verificar
              </Button>

              <View style={styles.resendBlock}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Reenviar código en {timer}s
                  </Text>
                ) : (
                  <>
                    {resendError.length > 0 ? (
                      <Text style={styles.errorText}>{resendError}</Text>
                    ) : null}
                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={resending}
                      accessibilityRole="button"
                      hitSlop={8}
                    >
                      <Text style={styles.resendLink}>
                        {resending ? 'Reenviando...' : 'Reenviar código'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: 28,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
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
    fontSize: 28,
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
    gap: spacing.md,
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
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  emailHighlight: {
    fontFamily: typography.semibold,
    color: colors.navy,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  otpBox: {
    flex: 1,
    maxWidth: 52,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: typography.bold,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  otpBoxFocused: {
    borderColor: colors.navy,
  },
  otpBoxFilled: {
    borderColor: colors.orange,
  },
  errorText: {
    fontFamily: typography.family,
    color: colors.red,
    fontSize: 12,
    textAlign: 'center',
  },
  resendBlock: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  timerText: {
    fontFamily: typography.family,
    color: colors.muted,
    fontSize: 13,
  },
  resendLink: {
    fontFamily: typography.extrabold,
    color: colors.orangeDeep,
    fontSize: 14,
  },
});
