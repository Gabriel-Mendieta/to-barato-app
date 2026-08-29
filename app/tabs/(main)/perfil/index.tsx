import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Platform,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useListItemCounts, useLists } from '@/src/features/lists/hooks';
import { useCurrentUser } from '@/src/features/profile/hooks';
import { clearSession, getAccessToken, getUserId, queryClient } from '@/src/shared/api';
import { showToast } from '@/src/shared/ui';
import { layout, radii, spacing, typography, useThemeColors } from '@/src/shared/theme';
import { useTranslation } from 'react-i18next';

type IconName = keyof typeof Ionicons.glyphMap;

type ProfileOptionProps = {
  icon: IconName;
  iconBackground: string;
  iconColor: string;
  title: string;
  subtitle: string;
  badge?: string;
  danger?: boolean;
  testID: string;
  onPress: () => void;
};

const NOTIFICATION_ITEMS = [
  {
    id: 'offers',
    icon: 'pricetag-outline' as IconName,
    titleKey: 'offers',
    bodyKey: 'offerDescription',
    timeKey: 'fourHoursAgo',
  },
  {
    id: 'reminder',
    icon: 'cart-outline' as IconName,
    titleKey: 'reminder',
    bodyKey: 'reminderDescription',
    timeKey: 'oneDayAgo',
  },
  {
    id: 'price',
    icon: 'trending-down-outline' as IconName,
    titleKey: 'priceUpdate',
    bodyKey: 'priceUpdateDescription',
    timeKey: 'twelveDaysAgo',
  },
];

function ProfileOption({
  icon,
  iconBackground,
  iconColor,
  title,
  subtitle,
  badge,
  danger = false,
  testID,
  onPress,
}: ProfileOptionProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: colors.card },
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <View style={styles.optionContent}>
        <View style={[styles.optionIcon, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.optionCopy}>
          <Text style={[styles.optionTitle, { color: danger ? colors.red : colors.ink }]}>
            {title}
          </Text>
          <Text style={[styles.optionSubtitle, { color: colors.muted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.optionTrailing}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.orangeSoft }]}>
            <Text style={[styles.badgeText, { color: colors.orangeDeep }]}>{badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={20} color={colors.tabInactive} />
      </View>
    </Pressable>
  );
}

function Metric({ label, value, testID }: { label: string; value: string; testID: string }) {
  return (
    <View style={styles.metric} testID={testID}>
      <Text
        style={styles.metricValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {value}
      </Text>
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const userQuery = useCurrentUser(sessionUserId);
  const listsQuery = useLists(sessionUserId);
  const listIds = useMemo(
    () => (listsQuery.data ?? []).map((list) => list.IdLista),
    [listsQuery.data],
  );
  const itemCountQueries = useListItemCounts(listIds);

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
    if (!userQuery.isError) return;
    void clearSession();
    showToast('error', t('profile.sessionExpired'), t('profile.sessionExpiredBody'));
    router.replace('/auth/IniciarSesion');
  }, [t, userQuery.isError]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await clearSession();
      queryClient.clear();
      router.replace('/auth/IniciarSesion');
    } finally {
      setLoggingOut(false);
    }
  };

  const notifications = useMemo(
    () =>
      NOTIFICATION_ITEMS.map((item) => ({
        ...item,
        title: t(`profile.${item.titleKey}`),
        body: t(`profile.${item.bodyKey}`),
        time: t(`profile.${item.timeKey}`),
      })),
    [t],
  );

  const user = userQuery.data;
  const loading = checkingSession || userQuery.isPending;
  const horizontalPadding = width >= layout.tabletBreakpoint ? layout.gutterWide : layout.gutter;
  const itemCount = itemCountQueries.reduce((total, query) => total + (query.data?.length ?? 0), 0);
  const fullName = user
    ? [user.Nombres, user.Apellidos].filter((part) => part?.trim()).join(' ') ||
      user.NombreUsuario ||
      t('profile.defaultName')
    : '';
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';
  const listCount = listsQuery.data?.length ?? 0;
  const itemCountError = itemCountQueries.some((query) => query.isError);
  const metricsLoading = listsQuery.isPending || itemCountQueries.some((query) => query.isPending);
  const unavailableMetric = t('profile.metricUnavailable');
  const version = Constants.expoConfig?.version;

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.orangeDeep} />
      </SafeAreaView>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.brand}>
          <Image
            source={require('../../../../assets/icons/logo.png')}
            style={[styles.logo, { tintColor: colors.orange }]}
            accessibilityLabel={t('profile.brandLogo')}
          />
          <Text style={[styles.brandName, { color: colors.navy }]}>To&apos;{'\n'}Barato</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.notifications')}
          onPress={() => setShowNotifications(true)}
          style={({ pressed }) => [
            styles.notificationButton,
            { backgroundColor: colors.card, borderColor: colors.line },
            pressed && styles.pressed,
          ]}
          testID="profile-notifications-header"
        >
          <Ionicons name="notifications-outline" size={24} color={colors.navy} />
          <View style={[styles.notificationDot, { backgroundColor: colors.red }]} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, paddingBottom: 116 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, width >= layout.tabletBreakpoint && styles.tabletContent]}>
          <View style={[styles.hero, { backgroundColor: colors.navy }]} testID="profile-hero">
            <View style={styles.heroTop}>
              <View style={styles.avatarWrapper}>
                {user.UrlPerfil ? (
                  <Image source={{ uri: user.UrlPerfil }} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarFallback,
                      { backgroundColor: colors.orange },
                    ]}
                  >
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
                {user.Estado ? (
                  <View
                    accessibilityLabel={t('profile.online')}
                    style={[styles.onlineIndicator, { backgroundColor: colors.green }]}
                  />
                ) : null}
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.greeting}>{t('profile.hello')}</Text>
                <Text style={styles.heroName} numberOfLines={2}>
                  {fullName}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('profile.editProfile')}
                onPress={() => router.push('/tabs/settings/EditProfile')}
                style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                testID="profile-edit-hero"
              >
                <Ionicons name="create-outline" size={22} color={colors.white} />
              </Pressable>
            </View>

            <View style={styles.metrics}>
              <Metric
                label={t('profile.saved')}
                value={unavailableMetric}
                testID="profile-metric-savings"
              />
              <Metric
                label={t('profile.products')}
                value={
                  metricsLoading || listsQuery.isError || itemCountError
                    ? unavailableMetric
                    : String(itemCount)
                }
                testID="profile-metric-products"
              />
              <Metric
                label={t('profile.lists')}
                value={
                  listsQuery.isPending || listsQuery.isError ? unavailableMetric : String(listCount)
                }
                testID="profile-metric-lists"
              />
            </View>
          </View>

          <View style={styles.options} testID="profile-options">
            <ProfileOption
              icon="settings-outline"
              iconBackground={colors.blueSoft}
              iconColor={colors.navySoft}
              title={t('profile.editProfile')}
              subtitle={t('profile.editProfileSubtitle')}
              testID="profile-option-edit"
              onPress={() => router.push('/tabs/settings/EditProfile')}
            />
            <ProfileOption
              icon="star-outline"
              iconBackground={colors.orangeSoft}
              iconColor={colors.orangeDeep}
              title={t('profile.preferences')}
              subtitle={t('profile.preferencesSubtitle')}
              testID="profile-option-preferences"
              onPress={() => showToast('info', t('profile.preferences'), t('profile.comingSoon'))}
            />
            <ProfileOption
              icon="notifications-outline"
              iconBackground={colors.orangeSoft}
              iconColor={colors.orangeDeep}
              title={t('profile.notifications')}
              subtitle={t('profile.notificationsSubtitle')}
              badge={String(notifications.length)}
              testID="profile-option-notifications"
              onPress={() => setShowNotifications(true)}
            />
            <ProfileOption
              icon="shield-checkmark-outline"
              iconBackground={colors.greenSoft}
              iconColor={colors.green}
              title={t('profile.privacySecurity')}
              subtitle={t('profile.privacySecuritySubtitle')}
              testID="profile-option-privacy"
              onPress={() => router.push('/tabs/settings/ChangePassword')}
            />
            <ProfileOption
              icon="log-out-outline"
              iconBackground={colors.redSoft}
              iconColor={colors.red}
              title={t('profile.logout')}
              subtitle={t('profile.logoutSubtitle')}
              danger
              testID="profile-option-logout"
              onPress={() => void handleLogout()}
            />
          </View>

          <Text style={[styles.footer, { color: colors.muted }]}>
            {t('profile.footer', { version: version ?? '1.0.0' })}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                width: width >= layout.tabletBreakpoint ? 520 : '88%',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.ink }]}>
                {t('profile.notifications')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('profile.close')}
                onPress={() => setShowNotifications(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.map((notification) => (
                <View
                  key={notification.id}
                  style={[styles.notificationItem, { borderBottomColor: colors.line }]}
                >
                  <Ionicons name={notification.icon} size={22} color={colors.orangeDeep} />
                  <View style={styles.notificationCopy}>
                    <Text style={[styles.notificationTitle, { color: colors.ink }]}>
                      {notification.title}
                    </Text>
                    <Text style={[styles.notificationBody, { color: colors.muted }]}>
                      {notification.body}
                    </Text>
                    <Text style={[styles.notificationTime, { color: colors.tabInactive }]}>
                      {notification.time}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowNotifications(false)}
              style={[styles.modalDone, { backgroundColor: colors.navy }]}
            >
              <Text style={styles.modalDoneText}>{t('profile.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  logo: { width: 34, height: 44, resizeMode: 'contain', marginRight: spacing.sm },
  brandName: {
    fontFamily: typography.extrabold,
    fontSize: typography.sizes.lg,
    lineHeight: 19,
    letterSpacing: -0.4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(230,233,240,0.9)',
    shadowColor: '#0B2545',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: Platform.select({ android: 2, default: 0 }),
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  scrollContent: { flexGrow: 1 },
  content: { width: '100%' },
  tabletContent: { maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  hero: { borderRadius: radii.xl, padding: spacing.xl, marginBottom: spacing.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    borderColor: '#F2A03D',
    backgroundColor: '#fff',
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontFamily: typography.extrabold, fontSize: 28 },
  onlineIndicator: {
    position: 'absolute',
    right: -1,
    bottom: 2,
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#0B2545',
  },
  heroCopy: { flex: 1, marginHorizontal: spacing.md },
  greeting: { color: '#B9C9DC', fontFamily: typography.medium, fontSize: typography.sizes.sm },
  heroName: {
    color: '#fff',
    fontFamily: typography.bold,
    fontSize: typography.sizes.lg,
    marginTop: 3,
  },
  editButton: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#31557D',
    borderWidth: 1,
    borderColor: '#55769A',
  },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  metric: {
    flex: 1,
    minHeight: 60,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  metricValue: { color: '#fff', fontFamily: typography.bold, fontSize: typography.sizes.md },
  metricLabel: {
    color: '#B9C9DC',
    fontFamily: typography.medium,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  options: { gap: spacing.sm },
  option: {
    minHeight: 76,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0B2545',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: Platform.select({ android: 3, default: 0 }),
  },
  optionContent: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: { flex: 1, marginLeft: spacing.md, paddingRight: spacing.sm },
  optionTitle: { fontFamily: typography.bold, fontSize: typography.sizes.md },
  optionSubtitle: { fontFamily: typography.medium, fontSize: typography.sizes.xs, marginTop: 2 },
  optionTrailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontFamily: typography.bold, fontSize: typography.sizes.xs },
  pressed: { opacity: 0.72 },
  footer: {
    textAlign: 'center',
    fontFamily: typography.medium,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 18, 35, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: { maxHeight: '78%', borderRadius: radii.xl, padding: spacing.lg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalTitle: { fontFamily: typography.bold, fontSize: typography.sizes.lg },
  modalClose: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  notificationItem: { flexDirection: 'row', paddingVertical: spacing.md, borderBottomWidth: 1 },
  notificationCopy: { flex: 1, marginLeft: spacing.md },
  notificationTitle: { fontFamily: typography.bold, fontSize: typography.sizes.sm },
  notificationBody: {
    fontFamily: typography.family,
    fontSize: typography.sizes.sm,
    lineHeight: 19,
    marginTop: 3,
  },
  notificationTime: {
    fontFamily: typography.medium,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  modalDone: {
    alignItems: 'center',
    borderRadius: radii.md,
    marginTop: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  modalDoneText: { color: '#fff', fontFamily: typography.bold, fontSize: typography.sizes.sm },
});
