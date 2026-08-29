import { api, endpoints } from '@/src/shared/api';
import {
  Chip,
  EmptyState,
  FadeInUp,
  FLOATING_TAB_BAR_CLEARANCE,
  Screen,
  Skeleton,
  showToast,
  triggerHaptic,
} from '@/src/shared/ui';
import { colors, getProviderBrand, radii, spacing, typography } from '@/src/shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region, UrlTile } from 'react-native-maps';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetModalMethods,
  BottomSheetView,
} from '@/src/shared/ui/BottomSheetCompat';

type TipoProveedor = {
  IdTipoProveedor: number;
  NombreTipoProveedor: string;
};

type Proveedor = {
  IdProveedor: number;
  Nombre: string;
  UrlLogo: string;
  IdTipoProveedor: number;
};

type Sucursal = {
  IdSucursal: number;
  NombreSucursal: string;
  Latitud: string;
  Longitud: string;
  IdProveedor: number;
};

type BranchCard = Sucursal & {
  lat: number;
  lng: number;
  distanceKm: number;
  provider?: Proveedor;
};

const CARD_WIDTH = 220;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number) {
  if (!Number.isFinite(km)) return '—';
  if (km < 1) return `${km.toFixed(1)} km`;
  return `${km.toFixed(1)} km`;
}

function pluralTipoLabel(nombre: string) {
  const n = nombre.trim();
  if (/supermercado/i.test(n)) return 'Supermercados';
  if (/farmacia/i.test(n)) return 'Farmacias';
  if (/ferreter/i.test(n)) return 'Ferreterías';
  return n.endsWith('s') ? n : `${n}s`;
}

function getBranchName(b: Sucursal, prov?: Proveedor) {
  if (!prov) return b.NombreSucursal;
  const stripped = b.NombreSucursal.replace(new RegExp(`^\\s*${prov.Nombre}\\s*`, 'i'), '').trim();
  return stripped || b.NombreSucursal;
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const carouselRef = useRef<FlatList<BranchCard>>(null);
  const branchSheetRef = useRef<BottomSheetModalMethods>(null);

  const [region, setRegion] = useState<Region | null>(null);
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [tipos, setTipos] = useState<TipoProveedor[]>([]);
  const [providers, setProviders] = useState<Proveedor[]>([]);
  const [branches, setBranches] = useState<Sucursal[]>([]);

  const [selectedTipo, setSelectedTipo] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [markersReady, setMarkersReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showToast('error', 'Sin permiso', 'No podemos obtener tu ubicación.');
          setRegion({
            latitude: 18.4861,
            longitude: -69.9312,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setUserCoords(coords);
        setRegion({
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch {
        setRegion({
          latitude: 18.4861,
          longitude: -69.9312,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    api
      .get<TipoProveedor[]>(endpoints.tipoproveedor)
      .then((res) => setTipos(res.data))
      .catch(() => undefined);

    api
      .get<Proveedor[]>(endpoints.proveedor)
      .then((res) => setProviders(res.data))
      .catch(() => undefined);

    api
      .get<Sucursal[]>(endpoints.sucursal)
      .then((res) => setBranches(res.data))
      .catch(() => undefined);
  }, []);

  const origin = userCoords ?? {
    latitude: region?.latitude ?? 18.4861,
    longitude: region?.longitude ?? -69.9312,
  };

  const nearby = useMemo(() => {
    const provById = new Map(providers.map((p) => [p.IdProveedor, p]));
    const q = query.trim().toLowerCase();

    const cards: BranchCard[] = [];
    for (const b of branches) {
      const prov = provById.get(b.IdProveedor);
      if (selectedTipo !== 'all' && prov?.IdTipoProveedor !== Number(selectedTipo)) {
        continue;
      }
      if (q) {
        const hay = `${prov?.Nombre ?? ''} ${b.NombreSucursal}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const lat = parseFloat(b.Latitud);
      const lng = parseFloat(b.Longitud);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
      cards.push({
        ...b,
        lat,
        lng,
        distanceKm: haversineKm(origin.latitude, origin.longitude, lat, lng),
        provider: prov,
      });
    }
    cards.sort((a, b) => a.distanceKm - b.distanceKm);
    return cards;
  }, [branches, providers, selectedTipo, query, origin.latitude, origin.longitude]);

  useEffect(() => {
    if (!nearby.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) =>
      prev != null && nearby.some((b) => b.IdSucursal === prev) ? prev : nearby[0].IdSucursal,
    );
  }, [nearby]);

  const selectBranch = useCallback(
    (id: number, animateMap = true) => {
      void triggerHaptic('selection');
      setSelectedId(id);
      const card = nearby.find((b) => b.IdSucursal === id);
      if (!card) return;
      if (animateMap) {
        mapRef.current?.animateToRegion(
          {
            latitude: card.lat,
            longitude: card.lng,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          },
          350,
        );
      }
      const idx = nearby.findIndex((b) => b.IdSucursal === id);
      if (idx >= 0) {
        carouselRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.1,
        });
      }
    },
    [nearby],
  );

  const openBranchDetail = useCallback(
    (id: number) => {
      selectBranch(id);
      requestAnimationFrame(() => branchSheetRef.current?.present());
    },
    [selectBranch],
  );

  const openNavigation = (lat: number, lng: number, label: string) => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url).catch(console.warn);
  };

  const recenter = () => {
    if (!userCoords) return;
    mapRef.current?.animateToRegion(
      {
        ...userCoords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      400,
    );
  };

  if (loading || region === null) {
    return (
      <Screen edges={['top']} style={styles.centered}>
        <Skeleton width="88%" height={220} borderRadius={22} />
        <Skeleton width="55%" height={18} style={styles.loadingLine} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} gutters={false} style={styles.root}>
      <FadeInUp index={0} step={55} delay={20}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.push('/tabs/home')}
            style={styles.iconBtn}
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={22} color={colors.navy} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            Mapa de proveedores
          </Text>
          <Pressable
            onPress={() => router.push('/tabs/search')}
            style={styles.iconBtn}
            accessibilityLabel="Buscar"
          >
            <Ionicons name="options-outline" size={20} color={colors.navy} />
          </Pressable>
        </View>
      </FadeInUp>

      <FadeInUp index={1} step={55} delay={20}>
        <View style={styles.searchBlock}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.tabInactive} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Búsqueda de proveedores"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <FilterPill
              label="Todos"
              active={selectedTipo === 'all'}
              onPress={() => {
                void triggerHaptic('selection');
                setSelectedTipo('all');
              }}
            />
            {tipos.map((t) => (
              <FilterPill
                key={t.IdTipoProveedor}
                label={pluralTipoLabel(t.NombreTipoProveedor)}
                active={selectedTipo === String(t.IdTipoProveedor)}
                onPress={() => {
                  void triggerHaptic('selection');
                  setSelectedTipo(String(t.IdTipoProveedor));
                }}
              />
            ))}
          </ScrollView>
        </View>
      </FadeInUp>

      <FadeInUp index={2} step={55} delay={20} style={styles.mapPad}>
        <View style={styles.mapFrame}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton={false}
            provider={PROVIDER_DEFAULT}
            mapType={Platform.OS === 'android' ? 'none' : 'standard'}
            onMapReady={() => setMarkersReady(true)}
          >
            <UrlTile
              urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            {markersReady &&
              nearby.map((b) => {
                const brand = getProviderBrand(b.IdProveedor);
                const isSel = selectedId === b.IdSucursal;
                const name = b.provider?.Nombre ?? 'Tienda';
                return (
                  <Marker
                    key={b.IdSucursal}
                    coordinate={{ latitude: b.lat, longitude: b.lng }}
                    onPress={() => openBranchDetail(b.IdSucursal)}
                    tracksViewChanges={false}
                    anchor={{ x: 0.5, y: 1 }}
                  >
                    <View style={styles.pinWrap}>
                      <View
                        style={[
                          styles.pinBubble,
                          {
                            backgroundColor: brand.color,
                            borderColor: colors.white,
                            shadowColor: isSel ? brand.color : '#000',
                            shadowOpacity: isSel ? 0.45 : 0.2,
                            transform: [{ scale: isSel ? 1.08 : 1 }],
                          },
                        ]}
                      >
                        <Ionicons name="location" size={12} color="#fff" />
                        <Text style={styles.pinLabel} numberOfLines={1}>
                          {name}
                        </Text>
                      </View>
                      <View style={[styles.pinTail, { borderTopColor: brand.color }]} />
                    </View>
                  </Marker>
                );
              })}
          </MapView>

          <Pressable
            onPress={recenter}
            style={styles.recenterBtn}
            accessibilityLabel="Centrar en mi ubicación"
          >
            <Ionicons name="navigate-outline" size={20} color={colors.navy} />
          </Pressable>
        </View>
      </FadeInUp>

      <FadeInUp index={3} step={55} delay={20}>
        <View style={styles.carouselWrap}>
          {nearby.length === 0 ? (
            <EmptyState
              icon="location-outline"
              title="Sin proveedores"
              description="Prueba con otro filtro o término de búsqueda."
            />
          ) : (
            <FlatList
              ref={carouselRef}
              data={nearby}
              keyExtractor={(item) => String(item.IdSucursal)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              snapToInterval={CARD_WIDTH + 10}
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                length: CARD_WIDTH + 10,
                offset: (CARD_WIDTH + 10) * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  carouselRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                  });
                }, 100);
              }}
              renderItem={({ item }) => {
                const brand = getProviderBrand(item.IdProveedor);
                const isSel = selectedId === item.IdSucursal;
                const name = item.provider?.Nombre ?? 'Proveedor';
                const branchLabel = getBranchName(item, item.provider);
                return (
                  <Pressable
                    onPress={() => openBranchDetail(item.IdSucursal)}
                    style={[
                      styles.card,
                      {
                        borderColor: isSel ? brand.color : colors.line,
                        shadowOpacity: isSel ? 0.18 : 0.04,
                        shadowColor: isSel ? brand.color : colors.navy,
                      },
                    ]}
                  >
                    <View style={styles.cardTop}>
                      {item.provider?.UrlLogo ? (
                        <Image
                          source={{ uri: item.provider.UrlLogo }}
                          style={[styles.avatar, { backgroundColor: brand.bg }]}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: brand.bg }]}>
                          <Text style={[styles.avatarLetter, { color: brand.color }]}>
                            {name.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.cardMeta}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {name}
                        </Text>
                        <Text style={styles.cardSub} numberOfLines={1}>
                          {formatDistance(item.distanceKm)} · {branchLabel}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardChips}>
                      <Chip tone="green" size="sm">
                        Cerca
                      </Chip>
                      <View style={styles.verifiedChip}>
                        <Ionicons name="checkmark-circle" size={11} color={colors.green} />
                        <Text style={styles.verifiedText}>Verificado</Text>
                      </View>
                    </View>

                    <Pressable
                      style={styles.routeBtn}
                      onPress={() => openNavigation(item.lat, item.lng, item.NombreSucursal)}
                    >
                      <Ionicons name="navigate" size={14} color={colors.white} />
                      <Text style={styles.routeBtnText}>Cómo llegar</Text>
                    </Pressable>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </FadeInUp>

      <BottomSheetModal
        ref={branchSheetRef}
        index={0}
        snapPoints={['34%']}
        enablePanDownToClose
        keyboardBehavior="interactive"
        backdropComponent={(props: Record<string, unknown>) => (
          <BottomSheetBackdrop {...props} pressBehavior="close" />
        )}
        backgroundStyle={{ backgroundColor: colors.card }}
      >
        <BottomSheetView style={styles.branchSheet}>
          {(() => {
            const branch = nearby.find((item) => item.IdSucursal === selectedId);
            if (!branch) return null;
            const brand = getProviderBrand(branch.IdProveedor);
            const providerName = branch.provider?.Nombre ?? 'Proveedor';
            return (
              <>
                <View style={styles.branchSheetHeader}>
                  <View style={[styles.avatar, { backgroundColor: brand.bg }]}>
                    <Text style={[styles.avatarLetter, { color: brand.color }]}>
                      {providerName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.branchSheetMeta}>
                    <Text style={styles.branchSheetTitle}>{providerName}</Text>
                    <Text style={styles.branchSheetSub}>
                      {getBranchName(branch, branch.provider)} · {formatDistance(branch.distanceKm)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.routeBtn}
                  onPress={() => openNavigation(branch.lat, branch.lng, branch.NombreSucursal)}
                  accessibilityRole="button"
                >
                  <Ionicons name="navigate" size={14} color={colors.white} />
                  <Text style={styles.routeBtnText}>Cómo llegar</Text>
                </Pressable>
              </>
            );
          })()}
        </BottomSheetView>
      </BottomSheetModal>
    </Screen>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillIdle]}
    >
      <Text
        style={[
          styles.filterPillText,
          active ? styles.filterPillTextActive : styles.filterPillTextIdle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingLine: { marginTop: spacing.lg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.extrabold,
    fontSize: 18,
    color: colors.navy,
    letterSpacing: -0.2,
  },

  searchBlock: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 11 : 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 13,
    color: colors.ink,
    paddingVertical: Platform.OS === 'android' ? 8 : 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingRight: spacing.lg,
  },
  filterPill: {
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterPillIdle: {
    backgroundColor: colors.white,
    borderColor: colors.line,
  },
  filterPillText: {
    fontFamily: typography.bold,
    fontSize: 12,
  },
  filterPillTextActive: { color: colors.white },
  filterPillTextIdle: { color: colors.ink },

  mapPad: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    minHeight: 220,
  },
  mapFrame: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#B6CCEA',
    backgroundColor: '#D9E5F0',
    ...Platform.select({
      ios: {
        shadowColor: colors.navy,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
      },
      android: { elevation: 4 },
    }),
  },
  map: { flex: 1 },
  recenterBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.navy,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },

  pinWrap: { alignItems: 'center' },
  pinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 14,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 10,
    borderWidth: 2,
    maxWidth: 140,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  pinLabel: {
    color: '#fff',
    fontFamily: typography.extrabold,
    fontSize: 11,
  },
  pinTail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  carouselWrap: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  carouselContent: {
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  emptyText: {
    fontFamily: typography.medium,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  branchSheet: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 28,
    gap: spacing.lg,
  },
  branchSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  branchSheetMeta: { flex: 1 },
  branchSheetTitle: {
    fontFamily: typography.extrabold,
    fontSize: 18,
    color: colors.navy,
  },
  branchSheetSub: {
    fontFamily: typography.medium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: typography.extrabold,
    fontSize: 16,
  },
  cardMeta: { flex: 1, minWidth: 0 },
  cardName: {
    fontFamily: typography.extrabold,
    fontSize: 14,
    color: colors.navy,
  },
  cardSub: {
    fontFamily: typography.semibold,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  cardChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF1F6',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: {
    fontFamily: typography.bold,
    fontSize: 10,
    color: '#4E5867',
  },
  routeBtn: {
    marginTop: 10,
    backgroundColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  routeBtnText: {
    fontFamily: typography.extrabold,
    fontSize: 12,
    color: colors.white,
  },
});
