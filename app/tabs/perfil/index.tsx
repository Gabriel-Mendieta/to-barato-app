// Archivo: app/settings/Profile.tsx

import {
  api,
  endpoints,
  clearSession,
  getAccessToken,
  getUserId,
  saveSession,
  hasStoredSession,
} from '@/src/shared/api';
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
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as SecureStore from 'expo-secure-store';
import { colors, typography } from '@/src/shared/theme';
import { showToast, triggerHaptic } from '@/src/shared/ui';
import { useTranslation } from 'react-i18next';

// --------------------------------------------------------------------
// TIPADO de la respuesta GET /usuario/{id}
// --------------------------------------------------------------------
type UsuarioResponse = {
  IdTipoUsuario: number;
  NombreUsuario: string;
  Correo: string;
  Telefono: string;
  Clave: string;
  Nombres: string;
  Apellidos: string;
  Estado: boolean;
  UrlPerfil: string; // URL de la imagen de perfil
  FechaNacimiento: string;
  IdUsuario: number;
  FechaCreacion: string;
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Estado para los datos del usuario
  const [userData, setUserData] = useState<UsuarioResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        // 1) Leer token y user_id desde SecureStore
        const token = await SecureStore.getItemAsync('access_token');
        const userId = await SecureStore.getItemAsync('user_id');

        if (!token || !userId) {
          // Si alguno falta, borramos todo y redirigimos a Login
          await clearSession();
          router.replace('/auth/IniciarSesion');
          return;
        }

        // 2) Fijamos el header para llamar al backend

        // 3) Hacer GET /usuario/{userId}
        const res = await api.get<UsuarioResponse>(endpoints.usuario(userId));
        setUserData(res.data);
      } catch {
        // Si el backend devuelve 401/403, el token ya no es válido → borramos todo y mandamos a Login
        await clearSession();

        showToast('error', t('profile.sessionExpired'), t('profile.sessionExpiredBody'));
        router.replace('/auth/IniciarSesion');
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const handleLogout = async () => {
    await clearSession();
    router.replace('/auth/IniciarSesion');
  };

  const handleDeleteAccount = () => {
    if (!userData) return;
    Alert.alert(t('profile.deleteAccount'), t('profile.deleteConfirmation'), [
      { text: t('shared.cancel'), style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(endpoints.usuario(userData.IdUsuario));
            // Después de eliminar, limpiamos credenciales y llevamos al login
            await clearSession();
            void triggerHaptic('success');
            showToast('success', t('profile.deleted'));
            router.replace('/auth/IniciarSesion');
          } catch {
            void triggerHaptic('error');
            showToast('error', t('profile.deleteFailed'), t('profile.tryAgain'));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.navy} />
      </SafeAreaView>
    );
  }

  if (!userData) {
    // Si por alguna razón no se cargó userData (por ejemplo, redirigimos al login),
    // simplemente retornamos null.
    return null;
  }

  // Nombre completo del usuario
  const fullName = `${userData.Nombres} ${userData.Apellidos}`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../../assets/icons/logo.png')} style={styles.logo} />
          <Text style={styles.headerText}>To' Barato</Text>
        </View>
        <TouchableOpacity onPress={() => setShowNotifications(true)}>
          <Ionicons name="notifications-outline" size={26} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* MODAL DE NOTIFICACIONES */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.notifications')}</Text>
              <Pressable onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </Pressable>
            </View>
            <ScrollView>
              {[
                {
                  id: 'n1',
                  title: t('profile.offers'),
                  desc: t('profile.offerDescription'),
                  time: t('profile.fourHoursAgo'),
                  icon: 'info-outline',
                },
                {
                  id: 'n2',
                  title: t('profile.reminder'),
                  desc: t('profile.reminderDescription'),
                  time: t('profile.oneDayAgo'),
                  icon: 'shopping-cart',
                },
                {
                  id: 'n3',
                  title: t('profile.priceUpdate'),
                  desc: t('profile.priceUpdateDescription'),
                  time: t('profile.twelveDaysAgo'),
                  icon: 'attach-money',
                },
              ].map((notif) => (
                <View key={notif.id} style={styles.notifCard}>
                  <View style={styles.notifLeft}>
                    <MaterialIcons name={notif.icon as any} size={24} color="#EDCA04" />
                    <View style={styles.notifTextContainer}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifDesc}>{notif.desc}</Text>
                    </View>
                  </View>
                  <Text style={styles.notifTime}>{notif.time}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowNotifications(false)}
            >
              <Text style={styles.closeButtonText}>{t('profile.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CABECERA CON DATOS DEL PERFIL */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.profileHeader}
        >
          <Text style={styles.title}>{t('profile.title')}</Text>

          {userData.UrlPerfil ? (
            <Image source={{ uri: userData.UrlPerfil }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={48} color="#AAA" />
            </View>
          )}

          <Text style={styles.name}>{fullName}</Text>
          {userData.Telefono ? <Text style={styles.contact}>{userData.Telefono}</Text> : null}
          <Text style={styles.contact}>{userData.Correo}</Text>
        </MotiView>

        {/* LISTA DE OPCIONES */}
        <View style={styles.optionsContainer}>
          {/* 1) EDITAR PERFIL */}
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => router.push('../tabs/settings/EditProfile')}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="settings-outline" size={22} color="#4B5563" />
              <Text style={styles.optionText}>{t('profile.editProfile')}</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          {/* 2) CAMBIAR CONTRASEÑA */}
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => router.push('../tabs/settings/ChangePassword')}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#4B5563" />
              <Text style={styles.optionText}>{t('profile.changePassword')}</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          {/* 3) PREFERENCIAS */}
          {/* <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => router.push("/settings/Preferences")}
                    >
                        <View style={styles.optionLeft}>
                            <Ionicons name="star-outline" size={22} color="#4B5563" />
                            <Text style={styles.optionText}>Preferencias</Text>
                        </View>
                        <MaterialIcons
                            name="keyboard-arrow-right"
                            size={24}
                            color="#6B7280"
                        />
                    </TouchableOpacity> */}

          {/* 4) ELIMINAR CUENTA */}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <View style={styles.optionLeft}>
              <Ionicons name="trash-outline" size={22} color="#D1170F" />
              <Text style={styles.deleteText}>{t('profile.deleteAccount')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* BOTÓN “CERRAR SESIÓN” AL FINAL */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.optionLeft}>
            <Ionicons name="log-out-outline" size={22} color="#D1170F" />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 32, height: 48, marginRight: 8, resizeMode: 'contain' },
  headerText: { color: colors.white, fontSize: 20, fontFamily: typography.bold },

  scrollContent: { paddingBottom: 20 },

  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 12,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: colors.white,
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { fontSize: 20, fontFamily: typography.semibold, color: colors.ink },
  contact: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  optionsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: colors.ink,
    marginLeft: 12,
  },

  // Botón “Eliminar cuenta”
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#D1170F',
    elevation: 2,
  },
  deleteText: {
    fontSize: 16,
    color: '#D1170F',
    marginLeft: 12,
  },

  // Botón “Cerrar Sesión” con contorno rojo
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1170F',
    backgroundColor: colors.card,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#D1170F',
    marginLeft: 8,
  },

  // Modal notificaciones
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  notifCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  notifLeft: { flexDirection: 'row', alignItems: 'flex-start' },
  notifTextContainer: { flex: 1, marginLeft: 8 },
  notifTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  notifDesc: { fontSize: 14, color: '#555' },
  notifTime: { fontSize: 12, color: '#999', marginTop: 8, textAlign: 'right' },
  closeButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.navy,
    borderRadius: 8,
  },
  closeButtonText: { color: colors.white, fontFamily: typography.semibold },

  // Contenedor de error (no debería mostrarse porque redirigimos a login)
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: '#D1170F', fontSize: 16 },
});
