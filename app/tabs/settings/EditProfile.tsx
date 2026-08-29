// app/settings/EditProfile.tsx

import { clearSession, getAccessToken, getUserId, getApiErrorMessage } from '@/src/shared/api';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography } from '@/src/shared/theme';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editProfileSchema, type EditProfileFormValues } from '@/src/features/profile/schema';
import { useCurrentUser, useUpdateUser } from '@/src/features/profile/hooks';
import type { UserDTO } from '@/src/shared/api/dto';
import { showToast, triggerHaptic } from '@/src/shared/ui';
import { useTranslation } from 'react-i18next';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
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
    (async () => {
      try {
        const token = await getAccessToken();
        const userId = await getUserId();
        if (!token || !userId) {
          await clearSession();
          router.replace('/auth/IniciarSesion');
          return;
        }
        setSessionUserId(userId);
      } catch {
        await clearSession();
        router.replace('/auth/IniciarSesion');
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!userData) return;
    reset({
      nombreUsuario: userData.NombreUsuario,
      correo: userData.Correo,
      telefono: userData.Telefono,
      nombres: userData.Nombres,
      apellidos: userData.Apellidos,
    });
  }, [reset, userData]);

  useEffect(() => {
    if (!userQuery.isError) return;
    void clearSession();
    showToast('error', t('profile.sessionExpired'), t('profile.sessionExpiredBody'));
    router.replace('/auth/IniciarSesion');
  }, [t, userQuery.isError]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('error', t('profile.permissionDenied'), t('profile.photoPermissionBody'));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!res.canceled) {
      void triggerHaptic('selection');
      setLocalImageUri(res.assets[0].uri);
    }
  };

  const handleSave = handleSubmit(async (values) => {
    if (!userData) return;

    try {
      const payload: Partial<
        Pick<UserDTO, 'NombreUsuario' | 'Telefono' | 'Nombres' | 'Apellidos' | 'UrlPerfil'>
      > = {};

      if (values.nombreUsuario !== userData.NombreUsuario)
        payload.NombreUsuario = values.nombreUsuario;
      // correo es solo lectura
      if (values.telefono !== userData.Telefono) payload.Telefono = values.telefono;
      if (values.nombres !== userData.Nombres) payload.Nombres = values.nombres;
      if (values.apellidos !== userData.Apellidos) payload.Apellidos = values.apellidos;

      if (localImageUri) {
        payload.UrlPerfil = localImageUri;
      }

      if (Object.keys(payload).length === 0) {
        showToast('info', t('profile.noChanges'), t('profile.noChangesBody'));
        return;
      }

      const updated = await updateUserMutation.mutateAsync(payload);
      reset({
        nombreUsuario: updated.NombreUsuario,
        correo: updated.Correo,
        telefono: updated.Telefono,
        nombres: updated.Nombres,
        apellidos: updated.Apellidos,
      });
      setLocalImageUri(null);
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.navy} />
      </SafeAreaView>
    );
  }
  if (!userData) return null;

  const fullName = `${userData.Nombres} ${userData.Apellidos}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('../../tabs/perfil')}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.editTitle')}</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.profileHeader}
        >
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            <Image
              source={{
                uri: localImageUri ?? userData.UrlPerfil ?? undefined,
              }}
              style={styles.avatar}
            />
            <View style={styles.editIcon}>
              <MaterialIcons name="edit" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{fullName}</Text>
        </MotiView>

        <View style={styles.form}>
          <Text style={styles.label}>{t('profile.username')}</Text>
          <Controller
            control={control}
            name="nombreUsuario"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.nombreUsuario && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
              />
            )}
          />
          {errors.nombreUsuario && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {errors.nombreUsuario.message}
            </Text>
          )}

          <Text style={styles.label}>{t('profile.email')}</Text>
          <Controller
            control={control}
            name="correo"
            render={({ field: { value } }) => (
              <TextInput
                style={[styles.input, styles.readOnly]}
                value={value}
                editable={false}
                selectTextOnFocus={false}
              />
            )}
          />
          {errors.correo && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {errors.correo.message}
            </Text>
          )}

          <Text style={styles.label}>{t('profile.phone')}</Text>
          <Controller
            control={control}
            name="telefono"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.telefono && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
              />
            )}
          />
          {errors.telefono && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {errors.telefono.message}
            </Text>
          )}

          <Text style={styles.label}>{t('profile.names')}</Text>
          <Controller
            control={control}
            name="nombres"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.nombres && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          {errors.nombres && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {errors.nombres.message}
            </Text>
          )}

          <Text style={styles.label}>{t('profile.surnames')}</Text>
          <Controller
            control={control}
            name="apellidos"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.apellidos && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          {errors.apellidos && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {errors.apellidos.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={submitting || (!isDirty && !localImageUri)}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveText}>{t('profile.saveChanges')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '500',
  },
  backButton: {
    width: 28,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', paddingVertical: 24, backgroundColor: colors.card },
  title: { fontSize: 24, fontFamily: typography.bold, color: colors.ink, marginBottom: 12 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#EEE' },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 4,
  },
  name: { fontSize: 20, fontFamily: typography.semibold, color: colors.ink },
  form: {
    marginTop: 12,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  label: { fontSize: 14, fontFamily: typography.medium, color: colors.ink, marginTop: 12 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  inputError: { borderWidth: 1, borderColor: colors.red },
  readOnly: { backgroundColor: '#ECECEC' },
  inlineError: {
    color: colors.red,
    fontSize: 12,
    marginTop: 4,
  },
  saveBtn: {
    marginTop: 24,
    marginHorizontal: 32,
    backgroundColor: colors.navy,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 3,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: colors.white, fontSize: 16, fontFamily: typography.semibold },
});
