import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, endpoints } from '@/src/shared/api';
import { Button, Chip, EmptyState, Screen, ScreenTitle, Skeleton } from '@/src/shared/ui';
import { colors, radii, spacing, typography } from '@/src/shared/theme';
import { useTranslation } from 'react-i18next';

type PassedInfo = {
  IdProducto: number;
  Nombre: string;
  UrlImagen: string | null;
  Precio: string;
  Descripcion: string;
  Unidad: string;
  Categoria: string;
  ProveedorNombre: string;
  ProveedorLogo: string;
};

type PrecioProveedor = {
  IdProveedor: number;
  NombreProveedor: string;
  UrlImagenProveedor: string;
  Precio: string;
  PrecioOferta?: string | null;
};

export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; data?: string }>();
  const productoId = Number(params.id);
  const raw = params.data ?? '';

  const [info, setInfo] = useState<PassedInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<PrecioProveedor[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);

  useEffect(() => {
    if (!raw) {
      // Allow deep link by id only — still fetch prices.
      setInfo({
        IdProducto: productoId,
        Nombre: `Producto #${productoId}`,
        UrlImagen: null,
        Precio: '—',
        Descripcion: '',
        Unidad: '',
        Categoria: '',
        ProveedorNombre: '',
        ProveedorLogo: '',
      });
      return;
    }
    try {
      setInfo(JSON.parse(decodeURIComponent(raw)));
    } catch {
      setError(t('product.readError'));
    }
  }, [raw, productoId]);

  useEffect(() => {
    if (!productoId) return;
    setLoadingPrices(true);
    api
      .get<PrecioProveedor[]>(endpoints.preciosProductos(productoId))
      .then(({ data }) => setPrices(data))
      .catch(() => undefined)
      .finally(() => setLoadingPrices(false));
  }, [productoId]);

  if (error) {
    return (
      <Screen>
        <Text style={styles.error}>{error}</Text>
        <Button onPress={() => router.back()}>{t('product.back')}</Button>
      </Screen>
    );
  }

  if (!info) {
    return (
      <Screen>
        <Skeleton width="100%" height={200} borderRadius={radii.xl} />
        <Skeleton width="70%" height={24} style={styles.skeletonLine} />
        <Skeleton width="35%" height={18} style={styles.skeletonLine} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
          <Text style={styles.backText}>{t('product.back')}</Text>
        </Pressable>

        {info.UrlImagen ? (
          <Image source={{ uri: info.UrlImagen }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroPh]}>
            <Ionicons name="cube-outline" size={40} color={colors.muted} />
          </View>
        )}

        <ScreenTitle>{info.Nombre}</ScreenTitle>
        {info.Categoria ? <Chip tone="navy">{info.Categoria}</Chip> : null}
        <Text style={styles.price}>
          RD$ {info.Precio}
          {info.Unidad ? <Text style={styles.unit}> / {info.Unidad}</Text> : null}
        </Text>
        {info.Descripcion ? <Text style={styles.desc}>{info.Descripcion}</Text> : null}

        <Text style={styles.section}>{t('product.pricesByProvider')}</Text>
        {loadingPrices ? (
          <View style={styles.priceSkeletons}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.priceSkeletonRow}>
                <Skeleton width="44%" height={14} />
                <Skeleton width="24%" height={14} />
              </View>
            ))}
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
