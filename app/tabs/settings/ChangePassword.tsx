// Archivo: app/settings/ChangePassword.tsx

import { api, endpoints, clearSession, getApiErrorMessage } from '@/src/shared/api';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors, typography } from '@/src/shared/theme';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/src/features/settings/schema';
import { showToast, triggerHaptic } from '@/src/shared/ui';
import { useTranslation } from 'react-i18next';

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);

  // Para almacenar el IdUsuario desde SecureStore
  const [userId, setUserId] = useState<number | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    (async () => {
      try {
        // Leer token y user_id de SecureStore
        const token = await SecureStore.getItemAsync('access_token');
        const idStr = await SecureStore.getItemAsync('user_id');
        if (!token || !idStr) {
          // Si falta, redirigir a login
          await clearSession();
          router.replace('/auth/IniciarSesion');
          return;
        }
        // Fijar header de autorización
        // Convertir Id a número
        setUserId(Number(idStr));
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const handleSave = handleSubmit(async ({ currentPassword, newPassword }) => {
    if (!userId) {
      showToast('error', t('profile.internalError'), t('profile.loginAgain'));
      return;
    }

    setSubmitError(null);
    try {
      // Preparar payload
      const payload = {
        IdUsuario: userId,
        Clave: currentPassword,
        ClaveNueva: newPassword,
      };
      // Enviar PUT a /change-password
      await api.put<{ message?: string }>(endpoints.changePassword, payload);
      // Si todo sale bien, mostrar mensaje y regresar
      void triggerHaptic('success');
      showToast('success', t('profile.passwordUpdated'));
      router.back();
    } catch (err) {
      void triggerHaptic('error');
      showToast('error', t('profile.passwordUpdateFailed'), t('profile.tryAgain'));
      setSubmitError(
        getApiErrorMessage(err, 'No se pudo cambiar la contraseña. Intenta nuevamente.'),
      );
    }
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.navy} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('../../tabs/perfil')}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.passwordTitle')}</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* FORMULARIO */}
        <View style={styles.formContainer}>
          {/* Contraseña actual */}
          <Text style={styles.label}>{t('profile.currentPassword')}</Text>
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.currentPassword && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('profile.currentPasswordPlaceholder')}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#888"
              />
            )}
          />
          {errors.currentPassword && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {errors.currentPassword.message}
            </Text>
          )}

          {/* Nueva contraseña */}
          <Text style={styles.label}>{t('profile.newPassword')}</Text>
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.newPassword && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('profile.newPasswordPlaceholder')}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#888"
              />
            )}
          />
          {errors.newPassword && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {errors.newPassword.message}
            </Text>
          )}

          {/* Confirmar nueva contraseña */}
          <Text style={styles.label}>{t('profile.confirmPassword')}</Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('profile.confirmPasswordPlaceholder')}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#888"
              />
            )}
          />
          {errors.confirmPassword && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {errors.confirmPassword.message}
            </Text>
          )}
          {submitError && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {submitError}
            </Text>
          )}
        </View>

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting || !isValid || !userId}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t('profile.saveChanges')}</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },

  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 28,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '500',
  },

  formContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F3F4F6', // Color de fondo gris claro
    borderRadius: 8, // Bordes redondeados iguales a Editar Perfil
    paddingHorizontal: 12, // Padding horizontal igual
    paddingVertical: 10, // Padding vertical igual
    fontSize: 16, // Tamaño de fuente igual
    color: colors.ink, // Mismo color de texto
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.red,
  },
  inlineError: {
    color: colors.red,
    fontSize: 12,
    marginTop: 4,
  },

  saveButton: {
    marginTop: 32,
    marginHorizontal: 32,
    backgroundColor: colors.navy,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.semibold,
  },
});
