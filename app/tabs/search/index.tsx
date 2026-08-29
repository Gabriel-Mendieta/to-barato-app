import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProductsByProvider } from '@/src/features/products/hooks';
import { useProviders } from '@/src/features/providers/hooks';
import { resolveEffectiveProviderId } from '@/src/features/providers/screenSelectors';
import {
  Button,
  Chip,
  EmptyState,
  Field,
  Screen,
  ScreenTitle,
  Skeleton,
  triggerHaptic,
} from '@/src/shared/ui';
import { colors, layout, radii, spacing, typography } from '@/src/shared/theme';
import { useTranslation } from 'react-i18next';

function parseProviderId(value: string | string[] | undefined): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue?.trim()) return null;
  const id = Number(rawValue);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const { proveedorId } = useLocalSearchParams<{ proveedorId?: string | string[] }>();
  const { width } = useWindowDimensions();
  const cols = width >= layout.tabletBreakpoint ? 3 : 2;
  const requestedProviderId = parseProviderId(proveedorId);

  const [query, setQuery] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const providersQuery = useProviders();
  const proveedores = providersQuery.data ?? [];
  const effectiveProviderId = resolveEffectiveProviderId(
    selectedProviderId,
    requestedProviderId,
    proveedores,
  );
  const productsQuery = useProductsByProvider(effectiveProviderId);
  const items = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.Producto.Nombre.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.navy} />
        <Text style={styles.backText}>{t('search.back')}</Text>
      </Pressable>
      <ScreenTitle>{t('search.title')}</ScreenTitle>

      <Field
        placeholder={t('search.placeholder')}
        testID="search-product-input"
        value={query}
        onChangeText={setQuery}
        trailing={<Ionicons name="mic-outline" size={20} color={colors.muted} />}
      />

      <FlatList
        horizontal
        data={proveedores}
        keyExtractor={(p) => String(p.IdProveedor)}
        showsHorizontalScrollIndicator={false}
        style={{ marginVertical: spacing.md, maxHeight: 44 }}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <Chip
            tone="navy"
            selected={effectiveProviderId === item.IdProveedor}
            onPress={() => {
              void triggerHaptic('selection');
              setSelectedProviderId(item.IdProveedor);
            }}
          >
            {item.Nombre}
          </Chip>
        )}
      />

      {providersQuery.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{t('search.providersFailed')}</Text>
          <Button full={false} onPress={() => void providersQuery.refetch()}>
            {t('search.retry')}
          </Button>
        </View>
      ) : null}

      {providersQuery.isPending || (effectiveProviderId != null && productsQuery.isPending) ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.skeletonCard}>
              <Skeleton width="100%" height={100} borderRadius={radii.md} />
              <Skeleton width="78%" height={14} />
              <Skeleton width="42%" height={12} />
            </View>
          ))}
        </View>
      ) : providersQuery.isError && effectiveProviderId == null ? null : productsQuery.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{t('search.productsFailed')}</Text>
          <Button full={false} onPress={() => void productsQuery.refetch()}>
            {t('search.retry')}
          </Button>
        </View>
      ) : effectiveProviderId == null ? (
        <EmptyState
          icon="storefront-outline"
          title={t('search.noProviders')}
          description={t('search.noProvidersBody')}
        />
      ) : (
        <FlatList
          data={filtered}
          key={cols}
          numColumns={cols}
          keyExtractor={(item) => `${item.IdProducto}-${item.IdProveedor}`}
          contentContainerStyle={{ paddingBottom: 100, gap: 12 }}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={t('search.noResults')}
              description={t('search.noResultsBody')}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { flex: 1 / cols, marginHorizontal: 6 }]}
              onPress={() => router.push(`/tabs/product/${item.IdProducto}`)}
            >
              {item.Producto.UrlImagen ? (
                <Image source={{ uri: item.Producto.UrlImagen }} style={styles.img} />
              ) : (
                <View style={[styles.img, styles.imgPh]}>
                  <Ionicons name="cube-outline" size={24} color={colors.muted} />
                </View>
              )}
              <Text numberOfLines={2} style={styles.name}>
                {item.Producto.Nombre}
              </Text>
              <Text style={styles.price}>RD$ {item.PrecioOferta ?? item.Precio}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: {
    fontFamily: typography.semibold,
    color: colors.navy,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 4,
  },
  img: { width: '100%', height: 100, borderRadius: radii.md, marginBottom: 8 },
  imgPh: {
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: typography.semibold,
    fontSize: 13,
    color: colors.ink,
    minHeight: 36,
  },
  price: {
    fontFamily: typography.extrabold,
    color: colors.navy,
    marginTop: 4,
  },
  error: {
    color: colors.red,
    fontFamily: typography.medium,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  empty: {
    color: colors.muted,
    fontFamily: typography.family,
    textAlign: 'center',
    marginTop: 40,
  },
  skeletonList: { flex: 1, gap: 10 },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
