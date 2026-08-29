import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ProductDTO } from '@/src/shared/api';
import { useProductDetail, useProductPrices } from '@/src/features/products/hooks';
import {
  firstRouteParam,
  parseProductId,
  type RouteParam,
} from '@/src/features/products/screenSelectors';
import { Button, Chip, EmptyState, Screen, ScreenTitle, Skeleton } from '@/src/shared/ui';
import { colors, radii, spacing, typography } from '@/src/shared/theme';
import { useTranslation } from 'react-i18next';

type PassedInfo = {
  IdProducto: number;
  Nombre: string;
  UrlImagen?: string | null;
  Precio?: string | number | null;
  Descripcion?: string | null;
  Unidad?: string;
  Categoria?: string;
  ProveedorNombre?: string;
  ProveedorLogo?: string;
};

function parsePassedInfo(raw: string | undefined): PassedInfo | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as Partial<PassedInfo>).IdProducto !== 'number' ||
      typeof (parsed as Partial<PassedInfo>).Nombre !== 'string'
    ) {
      return null;
    }
    return parsed as PassedInfo;
  } catch {
    return null;
  }
}

export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: RouteParam; data?: RouteParam }>();
  const productoId = parseProductId(params.id);
  const passedInfo = useMemo(() => parsePassedInfo(firstRouteParam(params.data)), [params.data]);
  const detailQuery = useProductDetail(productoId);
  const pricesQuery = useProductPrices(productoId);
  const prices = pricesQuery.data ?? [];
  const info = useMemo<PassedInfo | ProductDTO | null>(() => {
    if (!detailQuery.data && !passedInfo) return null;
    return { ...passedInfo, ...detailQuery.data } as PassedInfo | ProductDTO;
  }, [detailQuery.data, passedInfo]);

  if (productoId == null) {
    return (
      <Screen>
        <Text style={styles.error}>{t('product.invalidId')}</Text>
        <Button onPress={() => router.back()}>{t('product.back')}</Button>
      </Screen>
    );
  }

  const detailLoading = detailQuery.isPending && !info;
  const detailError = detailQuery.isError || (detailQuery.isSuccess && !info);
  const detailErrorMessage = detailQuery.isError
    ? t('product.detailFailed')
    : t('product.notFound');
  const displayPrice =
    info && 'Precio' in info && info.Precio != null && String(info.Precio) !== '—'
      ? info.Precio
      : (prices[0]?.PrecioOferta ?? prices[0]?.Precio ?? '—');
  const displayUnit = info && 'Unidad' in info ? info.Unidad : '';
  const displayCategory = info && 'Categoria' in info ? info.Categoria : '';
  const displayDescription =
    info && 'Descripcion' in info ? info.Descripcion : detailQuery.data?.Descripcion;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
          <Text style={styles.backText}>{t('product.back')}</Text>
        </Pressable>

        {detailLoading ? (
          <>
            <Skeleton width="100%" height={200} borderRadius={radii.xl} />
            <Skeleton width="70%" height={24} style={styles.skeletonLine} />
            <Skeleton width="35%" height={18} style={styles.skeletonLine} />
          </>
        ) : detailError ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{detailErrorMessage}</Text>
            {detailQuery.isError ? (
              <Button full={false} onPress={() => void detailQuery.refetch()}>
                {t('search.retry')}
              </Button>
            ) : null}
          </View>
        ) : info ? (
          <>
            {'UrlImagen' in info && info.UrlImagen ? (
              <Image source={{ uri: info.UrlImagen }} style={styles.hero} />
            ) : (
              <View style={[styles.hero, styles.heroPh]}>
                <Ionicons name="cube-outline" size={40} color={colors.muted} />
              </View>
            )}

            <ScreenTitle>{info.Nombre}</ScreenTitle>
            {displayCategory ? <Chip tone="navy">{displayCategory}</Chip> : null}
            <Text style={styles.price}>
              RD$ {displayPrice}
              {displayUnit ? <Text style={styles.unit}> / {displayUnit}</Text> : null}
            </Text>
            {displayDescription ? <Text style={styles.desc}>{displayDescription}</Text> : null}
          </>
        ) : (
          <Skeleton width="100%" height={200} borderRadius={radii.xl} />
        )}

        <Text style={styles.section}>{t('product.pricesByProvider')}</Text>
        {pricesQuery.isPending ? (
          <View style={styles.priceSkeletons}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.priceSkeletonRow}>
                <Skeleton width="44%" height={14} />
                <Skeleton width="24%" height={14} />
              </View>
            ))}
          </View>
        ) : pricesQuery.isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{t('product.pricesFailed')}</Text>
            <Button full={false} onPress={() => void pricesQuery.refetch()}>
              {t('search.retry')}
            </Button>
          </View>
        ) : (
          <FlatList
            data={prices}
            scrollEnabled={false}
            keyExtractor={(p) => String(p.IdProveedor)}
            ListEmptyComponent={
              <EmptyState
                icon="pricetag-outline"
                title={t('product.noAdditionalPrices')}
                description={t('product.noAdditionalPricesBody')}
              />
            }
            renderItem={({ item }) => (
              <View style={styles.priceRow}>
                <Text style={styles.prov}>{item.NombreProveedor}</Text>
                <Text style={styles.priceSm}>RD$ {item.PrecioOferta ?? item.Precio}</Text>
              </View>
            )}
          />
        )}
      </ScrollView>
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
  hero: {
    width: '100%',
    height: 200,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
  },
  heroPh: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: {
    fontFamily: typography.extrabold,
    fontSize: 24,
    color: colors.navy,
    marginVertical: spacing.sm,
  },
  unit: {
    fontFamily: typography.medium,
    fontSize: 14,
    color: colors.muted,
  },
  desc: {
    fontFamily: typography.family,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    fontFamily: typography.extrabold,
    fontSize: 16,
    color: colors.navy,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  prov: { fontFamily: typography.semibold, color: colors.ink },
  priceSm: { fontFamily: typography.bold, color: colors.navy },
  error: {
    color: colors.red,
    fontFamily: typography.medium,
    marginBottom: spacing.md,
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  skeletonLine: { marginTop: spacing.md },
  priceSkeletons: { gap: 12 },
  priceSkeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});
