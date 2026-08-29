import React, { useEffect, useMemo, useState } from 'react';
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
import { api, endpoints } from '@/src/shared/api';
import {
  Chip,
  EmptyState,
  Field,
  Screen,
  ScreenTitle,
  Skeleton,
  triggerHaptic,
} from '@/src/shared/ui';
import { colors, layout, radii, spacing, typography } from '@/src/shared/theme';

type Proveedor = {
  IdProveedor: number;
  Nombre: string;
  IdTipoProveedor: number;
};

type ProductoProveedorResponse = {
  IdProducto: number;
  IdProveedor: number;
  Precio: string;
  PrecioOferta?: string | null;
  Producto: {
    Nombre: string;
    UrlImagen: string | null;
    Descripcion: string;
  };
};

export default function SearchScreen() {
  const { proveedorId } = useLocalSearchParams<{ proveedorId?: string }>();
  const { width } = useWindowDimensions();
  const cols = width >= layout.tabletBreakpoint ? 3 : 2;

  const [query, setQuery] = useState('');
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [selectedProv, setSelectedProv] = useState<number | null>(
    proveedorId ? Number(proveedorId) : null,
  );
  const [items, setItems] = useState<ProductoProveedorResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<Proveedor[]>(endpoints.proveedor)
      .then(({ data }) => {
        setProveedores(data);
        if (!selectedProv && data[0]) setSelectedProv(data[0].IdProveedor);
      })
      .catch(console.warn);
  }, []);

  useEffect(() => {
    if (selectedProv == null) return;
    setLoading(true);
    api
      .get<ProductoProveedorResponse[]>(endpoints.preciosProductosProveedor(selectedProv))
      .then(({ data }) => setItems(data))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [selectedProv]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.Producto.Nombre.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.navy} />
        <Text style={styles.backText}>Volver</Text>
      </Pressable>
      <ScreenTitle>Buscar</ScreenTitle>

      <Field
        placeholder="Producto (voz = stub, sin STT)"
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
            selected={selectedProv === item.IdProveedor}
            onPress={() => {
              void triggerHaptic('selection');
              setSelectedProv(item.IdProveedor);
            }}
          >
            {item.Nombre}
          </Chip>
        )}
      />

      {loading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.skeletonCard}>
              <Skeleton width="100%" height={100} borderRadius={radii.md} />
              <Skeleton width="78%" height={14} />
              <Skeleton width="42%" height={12} />
            </View>
          ))}
        </View>
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
              title="Sin resultados"
              description="Prueba con otro producto o proveedor."
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
