// app/auth/Profile-setup.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, showToast, triggerHaptic } from '@/src/shared/ui';
import { colors, radii, spacing, typography } from '@/src/shared/theme';
import { useSignUp } from '@/src/features/auth/hooks';
import type { SignUpRequestDTO } from '@/src/features/auth/api';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSetupSchema, type ProfileSetupFormValues } from '@/src/features/auth/schema';

export default function ProfileSetupScreen() {
  // Recupera datos del paso anterior
  const params = useLocalSearchParams<{ data?: string; otp?: string }>();
  const rawData = params.data ?? '';
  const formData = rawData ? JSON.parse(decodeURIComponent(rawData)) : {};
  const otpCode = params.otp ?? '';

  const { signUp, loading, error } = useSignUp();

  const [showPicker, setShowPicker] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
    mode: 'onChange',
    defaultValues: {
      phone: '',
      photoUri: '',
      dob: new Date(1990, 0, 1),
    },
  });
  const photoUri = useWatch({ control, name: 'photoUri' });
  const dob = useWatch({ control, name: 'dob' });

  // picker handler
  const onChangeDate = (_: any, selected?: Date) => {
    setShowPicker(false);
    if (selected) setValue('dob', selected, { shouldValidate: true });
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!res.canceled) {
      setValue('photoUri', res.assets[0].uri, { shouldValidate: true });
    }
  };

  const handleFinish = handleSubmit(async ({ phone, photoUri, dob }) => {
    // prepara payload
    const payload: SignUpRequestDTO = {
      IdTipoUsuario: 2,
      NombreUsuario: formData.username,
      Correo: formData.email,
      Telefono: phone,
      Clave: formData.password,
      Nombres: formData.firstName,
      Apellidos: formData.lastName,
      Estado: true,
      UrlPerfil: photoUri,
      FechaNacimiento: dob.toISOString().split('T')[0], // formato YYYY-MM-DD
    };
    const res = await signUp(payload);
    if (res) {
      void triggerHaptic('success');
      router.replace('/tabs/home');
    } else {
      void triggerHaptic('error');
      showToast('error', 'No se pudo crear la cuenta', error ?? 'Intenta nuevamente.');
    }
  });

  useEffect(() => {
    console.log('Completa tu perfil:', { ...formData, otp: otpCode });
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, alignItems: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Completa tu perfil</Text>

        {/* Foto */}
        <TouchableOpacity onPress={pickImage} style={styles.photoWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text>Seleccionar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Teléfono */}
        <View style={styles.field}>
          <Text style={styles.label}>Teléfono</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder="809-123-4567"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={[styles.input, errors.phone && styles.inputError]}
              />
            )}
          />
          {errors.phone && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {errors.phone.message}
            </Text>
          )}
        </View>

        {/* Fecha de nacimiento */}
        <View style={styles.field}>
          <Text style={styles.label}>Fecha de nacimiento</Text>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.input}>
            <Text>{dob.toISOString().split('T')[0]}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={dob}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={onChangeDate}
            />
          )}
          {errors.dob && (
            <Text style={styles.inlineError} accessibilityRole="alert">
              {errors.dob.message}
            </Text>
          )}
        </View>

        {/* Botón Listo */}
        <View style={{ width: '100%' }}>
          <Button
            tone="navy"
            onPress={handleFinish}
            disabled={!isValid || isSubmitting || loading}
            loading={loading || isSubmitting}
          >
            Continuar
          </Button>
        </View>

        {errors.photoUri && (
          <Text style={styles.inlineError} accessibilityRole="alert">
            {errors.photoUri.message}
          </Text>
        )}
        {error && (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  photoWrap: { marginBottom: spacing.xl, alignItems: 'center' },
  photo: { width: 120, height: 120, borderRadius: radii.pill },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: radii.pill,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { width: '100%', marginBottom: spacing.xl },
  label: { fontFamily: typography.semibold, marginBottom: spacing.xs + 2 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#DBE1E7',
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    backgroundColor: colors.card,
    fontFamily: typography.family,
  },
  inputError: { borderColor: colors.red },
  inlineError: {
    color: colors.red,
    fontSize: 12,
    marginTop: -spacing.lg,
    alignSelf: 'flex-start',
  },
  error: {
    color: colors.red,
    marginTop: spacing.md,
    fontSize: 14,
    textAlign: 'center',
  },
});
