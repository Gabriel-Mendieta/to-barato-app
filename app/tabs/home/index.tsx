import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, endpoints } from '@/src/shared/api';
import {
  Screen,
  Stagger,
  Sparkline,
  CardSkeleton,
  EmptyState,
  showToast,
  triggerHaptic,
  FLOATING_TAB_BAR_CLEARANCE,
} from '@/src/shared/ui';
import {
  colors,
  getCategoryImageBg,
  getProviderBrand,
  layout,
  radii,
  spacing,
  typography,
} from '@/src/shared/theme';
import { getProductImageUrl, getUnitAbbrev } from '@/src/shared/products/meta';
import { getProductoById, SUPERMARKET_PROVIDER_IDS } from '@/src/shared/dev/mocks/data';
import { useTranslation } from 'react-i18next';

type Proveedor = {
  IdProveedor: number;
  Nombre: string;
  UrlLogo: string;
  IdTipoProveedor: number;
};

type ProductoProveedorResponse = {
  IdProducto: number;
  IdProveedor?: number;
  Precio: string;
  PrecioOferta?: string | null;
  Producto: {
    Nombre: string;
    UrlImagen: string | null;
    IdCategoria?: number;
    IdUnidadMedida?: number;
    Unidad?: string;
  };
};

type DealCard = ProductoProveedorResponse & {
  IdProveedor: number;
  providerName: string;
};

const CATEGORIES = ['Ofertas', 'Mercado', 'Farmacia', 'Ferretería'] as const;
const SPARKLINE_DATA = [12, 18, 15, 24, 22, 30, 35, 32, 42, 48];

function formatMoney(value: number) {
  const whole = Math.floor(value);
  const cents = Math.round((value - whole) * 100);
  return {
    whole: whole.toLocaleString('es-DO'),
    cents: cents.toString().padStart(2, '0'),
  };
}

function discountPct(precio: string, oferta: string | null | undefined) {
  if (!oferta) return 0;
  const was = Number(precio);
  const now = Number(oferta);
  if (!was || !now || now >= was) return 0;
  return Math.round(((was - now) / was) * 100);
}

function resolveImage(item: DealCard) {
  return item.Producto.UrlImagen || getProductImageUrl(item.IdProducto);
}

function resolveUnit(item: DealCard) {
  if (item.Producto.Unidad) return item.Producto.Unidad;
  const local = getProductoById(item.IdProducto);
  if (local) return getUnitAbbrev(local.IdUnidadMedida);
  return '';
}

function resolveBg(item: DealCard) {
  const cat = item.Producto.IdCategoria ?? getProductoById(item.IdProducto)?.IdCategoria ?? 1;
  return getCategoryImageBg(cat);
}

function DealImage({ uri, bg }: { uri: string; bg: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.dealImgWrap, { backgroundColor: bg }]}>
      {failed ? (
        <Ionicons name="basket-outline" size={36} color={colors.muted} />
      ) : (
        <Image
          source={{ uri }}
          style={styles.dealImg}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

export default function HomeDashboard() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const wide = width >= layout.tabletBreakpoint;
  const cardW = wide ? Math.min(168, width / 4 - 24) : 158;

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [deals, setDeals] = useState<DealCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Ofertas');

  const savingsStub = useMemo(() => ({ saved: 1248.5, compared: 18 }), []);
  const money = formatMoney(savingsStub.saved);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: provs } = await api.get<Proveedor[]>(endpoints.proveedor);
        if (cancelled) return;
        const supers = provs.filter((p) =>
          (SUPERMARKET_PROVIDER_IDS as readonly number[]).includes(p.IdProveedor),
        );
        setProveedores(supers.length ? supers.slice(0, 8) : provs.slice(0, 8));

        const targets = (supers.length ? supers : provs).slice(0, 4);
        const batches = await Promise.all(
          targets.map(async (p) => {
            try {
              const { data } = await api.get<ProductoProveedorResponse[]>(
                endpoints.preciosProductosProveedor(p.IdProveedor),
              );
              return data
                .filter((row) => row.PrecioOferta)
                .slice(0, 4)
                .map((row) => ({
                  ...row,
                  IdProveedor: row.IdProveedor ?? p.IdProveedor,
                  providerName: p.Nombre,
                }));
            } catch {
              return [] as DealCard[];
            }
          }),
        );

        if (!cancelled) {
          const merged = batches.flat();
          const seen = new Set<string>();
          const unique: DealCard[] = [];
          for (const d of merged) {
            const key = `${d.IdProducto}-${d.IdProveedor}`;
            if (seen.has(key)) continue;
            seen.add(key);
            unique.push(d);
          }
          setDeals(unique.slice(0, 12));
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onMic = () => {
    showToast('info', t('auth.login.comingSoon'), t('home.voiceSearchComingSoon'));
  };

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}
        showsVerticalScrollIndicator={false}
      >
        <Stagger step={65} delay={30}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../../assets/icons/logo.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
              <Text style={styles.logo}>
                To' <Text style={{ color: colors.orange }}>Barato</Text>
              </Text>
            </View>
            <Pressable
              style={styles.bell}
              onPress={() => setNotifOpen((v) => !v)}
              accessibilityLabel={t('home.notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.navy} />
              <View style={styles.badge} />
            </Pressable>
          </View>

          {notifOpen ? (
            <View style={styles.notifSheet}>
              <Text style={styles.sectionTitle}>{t('home.notifications')}</Text>
              <Text style={styles.muted}>{t('home.notificationsUnavailable')}</Text>
            </View>
          ) : null}

          {/* Savings */}
          <View style={styles.savingsCard}>
            <View style={styles.savingsLabelRow}>
              <Ionicons name="sparkles" size={14} color={colors.orange} />
              <Text style={styles.savingsLabel}>{t('home.savingsThisMonth')}</Text>
            </View>
            <Text style={styles.savingsValue}>
              RD$ {money.whole}
              <Text style={styles.savingsCents}>.{money.cents}</Text>
            </Text>
            <View style={styles.savingsMeta}>
              <View style={styles.pctBadge}>
                <Ionicons name="trending-down" size={12} color={colors.navy} />
                <Text style={styles.pctText}>
                  {t('home.comparedLastMonth', { percent: savingsStub.compared })}
                </Text>
              </View>
            </View>
            <Sparkline
              data={SPARKLINE_DATA}
              labels={['', '', '', '', '', '', '', '', '', 'Hoy']}
              height={36}
            />
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <Pressable style={styles.searchMain} onPress={() => router.push('/tabs/search')}>
              <Ionicons name="search" size={20} color={colors.tabInactive} />
              <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
            </Pressable>
            <Pressable onPress={onMic} hitSlop={10} accessibilityLabel={t('home.voiceSearch')}>
              <Ionicons name="mic-outline" size={20} color={colors.tabInactive} />
            </Pressable>
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    void triggerHaptic('selection');
                    setCategory(c);
                  }}
                  style={[styles.catPill, active && styles.catPillActive]}
                >
                  <Text style={[styles.catText, active && styles.catTextActive]}>
                    {c === 'Ofertas'
                      ? t('home.categories.offers')
                      : c === 'Mercado'
                        ? t('home.categories.market')
                        : c === 'Farmacia'
                          ? t('home.categories.pharmacy')
                          : t('home.categories.hardware')}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Bajadas de precio */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t('home.priceDrops')}</Text>
              <View style={styles.hoyBadge}>
                <Ionicons name="trending-down" size={11} color="#0E7A4B" />
                <Text style={styles.hoyText}>{t('home.today')}</Text>
              </View>
            </View>
          </View>

          {loading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {[0, 1, 2].map((item) => (
                <CardSkeleton key={item} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
            >
              {deals.length === 0 ? (
                <EmptyState
                  icon="trending-down-outline"
                  title={t('home.noPriceDrops')}
                  description={t('home.noPriceDropsBody')}
                />
              ) : (
                deals.map((item) => {
                  const pct = discountPct(item.Precio, item.PrecioOferta);
                  const brand = getProviderBrand(item.IdProveedor);
                  const price = item.PrecioOferta ?? item.Precio;
                  const unit = resolveUnit(item);
                  return (
                    <Pressable
                      key={`${item.IdProducto}-${item.IdProveedor}`}
                      style={[styles.dealCard, { width: cardW }]}
                      onPress={() => router.push(`/tabs/product/${item.IdProducto}` as const)}
                    >
                      {pct > 0 ? (
                        <View style={styles.discountBadge}>
                          <Ionicons name="trending-down" size={10} color="#fff" />
                          <Text style={styles.discountText}>-{pct}%</Text>
                        </View>
                      ) : null}
                      <DealImage uri={resolveImage(item)} bg={resolveBg(item)} />
                      <Text numberOfLines={2} style={styles.dealName}>
                        {item.Producto.Nombre}
                      </Text>
                      <View style={styles.storeChip}>
                        <View style={[styles.storeDot, { backgroundColor: brand.color }]} />
                        <Text style={styles.storeName} numberOfLines={1}>
                          {item.providerName}
                        </Text>
                      </View>
                      <View style={styles.priceRow}>
                        <Text style={styles.dealPrice}>RD${Number(price).toFixed(2)}</Text>
                        {unit ? <Text style={styles.dealUnit}>{unit}</Text> : null}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Tiendas cerca de ti */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t('home.nearbyStores')}</Text>
            <Pressable onPress={() => router.push('/tabs/map')} style={styles.linkRow}>
              <Text style={styles.link}>{t('home.seeMap')}</Text>
            </Pressable>
          </View>

          <View style={styles.storesGrid}>
            {loading
              ? [0, 1, 2, 3].map((item) => <CardSkeleton key={item} compact />)
              : proveedores.slice(0, 4).map((p) => {
                  const brand = getProviderBrand(p.IdProveedor);
                  return (
                    <Pressable
                      key={p.IdProveedor}
                      style={styles.storeCard}
                      onPress={() =>
                        router.push({
                          pathname: '/tabs/search',
                          params: { proveedorId: String(p.IdProveedor) },
                        })
                      }
                    >
                      <View style={[styles.storeInitial, { backgroundColor: brand.bg }]}>
                        <Text style={[styles.storeInitialText, { color: brand.color }]}>
                          {p.Nombre.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.storeCardName} numberOfLines={1}>
                        {p.Nombre}
                      </Text>
                    </Pressable>
                  );
                })}
          </View>

          {/* Recipe CTA */}
          <Pressable style={styles.recipeCta} onPress={() => router.push('/tabs/lista')}>
            <View style={styles.recipeIcon}>
              <Text style={{ fontSize: 28 }}>🥗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recipeEyebrow}>{t('home.generateRecipe')}</Text>
              <Text style={styles.ctaTitle}>{t('home.recipeTitle')}</Text>
              <Text style={styles.recipeMeta}>{t('home.recipeBody')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A35A0E" />
          </Pressable>
        </Stagger>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    width: 36,
    height: 40,
  },
  logo: {
    fontFamily: typography.extrabold,
    fontSize: 22,
    color: colors.navy,
    letterSpacing: -0.4,
  },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  notifSheet: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  savingsCard: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.navy,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  savingsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingsLabel: {
    color: '#FFD49A',
    fontFamily: typography.bold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  savingsValue: {
    color: colors.white,
    fontFamily: typography.extrabold,
    fontSize: 34,
    marginTop: 4,
    letterSpacing: -0.6,
  },
  savingsCents: {
    fontFamily: typography.medium,
    fontSize: 22,
    color: 'rgba(255,255,255,0.8)',
  },
  savingsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  pctBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.orange,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  pctText: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: colors.navy,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    marginBottom: spacing.md,
  },
  searchMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    color: colors.muted,
    fontFamily: typography.medium,
    fontSize: 14,
  },
  catRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
    marginBottom: spacing.sm,
  },
  catPill: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  catPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  catText: {
    fontFamily: typography.bold,
    fontSize: 12.5,
    color: colors.ink,
  },
  catTextActive: {
    color: colors.white,
  },
  sectionTitle: {
    fontFamily: typography.extrabold,
    fontSize: 16,
    color: colors.navy,
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hoyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  hoyText: {
    fontFamily: typography.extrabold,
    fontSize: 10,
    color: '#0E7A4B',
  },
  link: {
    color: colors.orangeDeep,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dealCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.navy,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  discountText: {
    color: '#fff',
    fontFamily: typography.extrabold,
    fontSize: 10,
  },
  dealImgWrap: {
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealImg: {
    width: '100%',
    height: '100%',
  },
  dealName: {
    fontFamily: typography.bold,
    fontSize: 13,
    color: colors.ink,
    minHeight: 34,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  storeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storeName: {
    fontSize: 11,
    fontFamily: typography.semibold,
    color: colors.muted,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  dealPrice: {
    fontFamily: typography.extrabold,
    color: colors.navy,
    fontSize: 15,
  },
  dealUnit: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: typography.medium,
  },
  storesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  storeCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
  },
  storeInitial: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInitialText: {
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  storeCardName: {
    fontSize: 10,
    fontFamily: typography.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  recipeCta: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF4E0',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD49A',
  },
  recipeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeEyebrow: {
    fontFamily: typography.extrabold,
    fontSize: 10,
    color: '#A35A0E',
    letterSpacing: 0.5,
  },
  ctaTitle: {
    fontFamily: typography.extrabold,
    color: '#7A4B0E',
    fontSize: 14,
    marginTop: 2,
  },
  recipeMeta: {
    fontFamily: typography.semibold,
    fontSize: 11,
    color: '#A35A0E',
    marginTop: 2,
  },
  muted: {
    color: colors.muted,
    fontFamily: typography.family,
    fontSize: 12,
  },
});
