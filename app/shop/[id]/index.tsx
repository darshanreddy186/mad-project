import { View, Text, ScrollView, Image, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Share2,
  Navigation,
  BadgeCheck,
  ChevronRight,
  FileText,
  MessageSquare,
  Star,
  Store,
  AlertTriangle,
  Timer,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Colors } from '@/constants/theme';
import { SHOP_STATUS, REPORT_REASONS } from '@/constants/status';
import { RatingStars } from '@/components/RatingStars';
import { ReviewCard } from '@/components/ReviewCard';
import { PriceLevel, Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { FavouriteButton } from '@/components/FavouriteButton';
import { ImageViewer } from '@/components/ImageViewer';
import { ErrorView, LoadingView, EmptyState } from '@/components/StateViews';
import { getShopDetails } from '@/api/shops';
import { createReport } from '@/api/admin';
import { useQuery } from '@/hooks/useQuery';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import { toast } from '@/store/useToastStore';
import { formatDistance, formatPrice, formatPriceRange, formatTime } from '@/lib/format';
import { callPhone, openDirections, openWebsite, sendEmail, shareShop } from '@/lib/linking';
import { DAY_KEYS, isOpenNow } from '@/lib/schedule';
import { choose } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';

type Tab = 'services' | 'portfolio' | 'reviews' | 'about';

const run = (p: Promise<unknown>) => p.catch((err) => toast.error(getErrorMessage(err)));

export default function ShopDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [viewer, setViewer] = useState<{ uri: string; caption?: string | null } | null>(null);

  const categories = useAppStore((s) => s.categories);
  const coords = useLocationStore((s) => s.coords);
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const requireAuth = useRequireAuth();

  const { data, loading, error, refresh, refreshing } = useQuery(
    () => getShopDetails(id, coords, categories),
    [id, coords?.latitude, coords?.longitude, categories.length],
    { enabled: Boolean(id), refetchOnFocus: true }
  );

  const shop = data?.shop;
  const myReview = useMemo(
    () => (userId ? data?.reviews.find((r) => r.user_id === userId) : undefined),
    [data?.reviews, userId]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <LoadingView />
      </SafeAreaView>
    );
  }

  if (error || !data || !shop) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        {error ? (
          <ErrorView message={error} onRetry={refresh} />
        ) : (
          <EmptyState icon={Store} title="Shop not found" message="This shop may have been removed or is not yet approved." actionLabel="Go back" onAction={() => router.back()} />
        )}
      </SafeAreaView>
    );
  }

  const { services, reviews, portfolio, images } = data;
  const isOwnShop = userId === shop.owner_id;
  const isLive = shop.status === 'approved';
  const canTransact = isLive && !isOwnShop;
  const openNow = isOpenNow(shop.opening_hours);
  const distance = formatDistance(shop.distance_km);
  const todayKey = DAY_KEYS[new Date().getDay()];
  const shopCats = shop.category_slugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const gated = (message: string, action: () => void) => () => {
    if (requireAuth(message)) action();
  };

  const reportReview = async (reviewId: string) => {
    if (!requireAuth('Sign in to report reviews.') || !userId) return;
    const reason = await choose(
      'Report review',
      REPORT_REASONS.map((r) => ({ label: r, value: r })),
      'Why are you reporting this review?'
    );
    if (!reason) return;
    try {
      await createReport({ reporterId: userId, reviewId, reason });
      toast.success('Thanks — our team will review this.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'services', label: `Services (${services.length})` },
    { key: 'portfolio', label: `Portfolio (${portfolio.length})` },
    { key: 'reviews', label: `Reviews (${shop.review_count})` },
    { key: 'about', label: 'About' },
  ];

  const quickActions = [
    { label: 'Call', icon: Phone, color: Colors.accent[500], onPress: () => run(callPhone(shop.phone)) },
    {
      label: 'Directions',
      icon: Navigation,
      color: Colors.electric[400],
      onPress: () => run(openDirections(shop.latitude, shop.longitude, shop.name)),
    },
    ...(canTransact
      ? [
          {
            label: 'Message',
            icon: MessageSquare,
            color: Colors.success[500],
            onPress: gated('Sign in to message this shop.', () => router.push(`/shop/${shop.id}/enquiry`)),
          },
          {
            label: 'Quote',
            icon: FileText,
            color: Colors.warning[500],
            onPress: gated('Sign in to request a quote.', () => router.push(`/shop/${shop.id}/enquiry?type=quote`)),
          },
        ]
      : []),
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: canTransact ? 120 : 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.accent[500]} />}>
        {/* Cover image */}
        <View className="relative w-full" style={{ height: 240 + insets.top }}>
          {shop.cover_image_url ? (
            <Image source={{ uri: shop.cover_image_url }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center" style={{ backgroundColor: Colors.charcoal[800] }}>
              <Store size={48} color={Colors.charcoal[600]} />
            </View>
          )}
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(15,17,21,0.4)' }} />

          {/* Top bar */}
          <View className="absolute left-0 right-0 flex-row items-center justify-between px-4" style={{ top: insets.top + 8 }}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              accessibilityLabel="Go back"
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(15,17,21,0.7)' }}>
              <ArrowLeft size={20} color={Colors.white} />
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => run(shareShop(shop))}
                accessibilityLabel="Share shop"
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(15,17,21,0.7)' }}>
                <Share2 size={18} color={Colors.white} />
              </Pressable>
              {isLive && <FavouriteButton shopId={shop.id} translucent />}
            </View>
          </View>
          {shop.logo_url && (
            <Image
              source={{ uri: shop.logo_url }}
              className="absolute -bottom-7 left-5 h-16 w-16 rounded-2xl"
              style={{ borderWidth: 3, borderColor: Colors.charcoal[950] }}
            />
          )}
        </View>

        {!isLive && (
          <View className="mx-5 mt-4 flex-row items-start gap-3 rounded-2xl p-3.5" style={{ backgroundColor: `${SHOP_STATUS[shop.status].color}20` }}>
            <AlertTriangle size={18} color={SHOP_STATUS[shop.status].color} />
            <Text className="flex-1 text-xs" style={{ color: Colors.charcoal[100] }}>
              {SHOP_STATUS[shop.status].label}: this listing is not visible to customers.
              {shop.rejection_reason ? ` Reason: ${shop.rejection_reason}` : ''}
            </Text>
          </View>
        )}

        {/* Shop header */}
        <View className={`px-5 ${shop.logo_url ? 'pt-10' : 'pt-4'}`}>
          <View className="flex-row flex-wrap items-center gap-2">
            {shop.is_verified && (
              <View className="flex-row items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: `${Colors.electric[500]}20` }}>
                <BadgeCheck size={12} color={Colors.electric[400]} />
                <Text className="text-[10px] font-semibold" style={{ color: Colors.electric[400] }}>Verified</Text>
              </View>
            )}
            {openNow !== null && (
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${openNow ? Colors.success[500] : Colors.error[500]}20` }}>
                <Text className="text-[10px] font-semibold" style={{ color: openNow ? Colors.success[500] : Colors.error[500] }}>
                  {openNow ? 'Open now' : 'Closed now'}
                </Text>
              </View>
            )}
            <PriceLevel level={shop.price_level} />
          </View>
          <Text className="mt-2 text-2xl font-bold text-white">{shop.name}</Text>
          <Pressable onPress={() => run(openDirections(shop.latitude, shop.longitude, shop.name))} className="mt-1.5 flex-row items-center gap-2">
            <MapPin size={14} color={Colors.charcoal[400]} />
            <Text className="flex-1 text-sm" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
              {shop.address}, {shop.city}
              {distance ? ` · ${distance} away` : ''}
            </Text>
          </Pressable>
          <View className="mt-3 flex-row items-center gap-3">
            <RatingStars rating={shop.rating} size={16} showValue reviewCount={shop.review_count} />
          </View>

          {/* Quick actions */}
          <View className="mt-4 flex-row gap-2">
            {quickActions.map((a) => (
              <Pressable
                key={a.label}
                onPress={a.onPress}
                accessibilityRole="button"
                className="flex-1 items-center justify-center gap-1.5 rounded-xl py-3"
                style={{ backgroundColor: Colors.charcoal[800] }}>
                <a.icon size={18} color={a.color} />
                <Text className="text-xs font-semibold text-white">{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View className="mt-5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            <View className="flex-row gap-2">
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === tab.key }}
                  className="rounded-full px-4 py-2"
                  style={{
                    backgroundColor: activeTab === tab.key ? Colors.accent[600] : Colors.charcoal[800],
                  }}>
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: activeTab === tab.key ? Colors.white : Colors.charcoal[300] }}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tab content */}
        <View className="mt-4 px-5">
          {activeTab === 'services' && (
            <View>
              {services.length === 0 ? (
                <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>No services listed yet.</Text>
              ) : (
                services.map((svc) => {
                  const cat = categories.find((c) => c.id === svc.category_id);
                  return (
                    <Pressable
                      key={svc.id}
                      disabled={!canTransact}
                      onPress={gated('Sign in to book an appointment.', () => router.push(`/shop/${shop.id}/book?service=${svc.id}`))}
                      className="mb-3 rounded-2xl p-4"
                      style={{ backgroundColor: Colors.charcoal[800] }}>
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-white">{svc.name}</Text>
                          {!!svc.description && (
                            <Text className="mt-1 text-xs" style={{ color: Colors.charcoal[400] }} numberOfLines={3}>
                              {svc.description}
                            </Text>
                          )}
                          <View className="mt-2 flex-row flex-wrap items-center gap-2">
                            {cat && <Badge label={cat.name} color={cat.color} />}
                            {svc.duration_minutes && (
                              <View className="flex-row items-center gap-1">
                                <Timer size={11} color={Colors.charcoal[400]} />
                                <Text className="text-[10px]" style={{ color: Colors.charcoal[400] }}>
                                  {svc.duration_minutes >= 60
                                    ? `${Math.round((svc.duration_minutes / 60) * 10) / 10}h`
                                    : `${svc.duration_minutes} min`}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-base font-bold" style={{ color: Colors.accent[500] }}>
                            {formatPriceRange(svc.price_from, svc.price_to)}
                          </Text>
                          <Text className="text-[10px]" style={{ color: Colors.charcoal[500] }}>
                            {svc.unit}
                          </Text>
                          {canTransact && (
                            <View className="mt-2 flex-row items-center gap-0.5">
                              <Text className="text-[11px] font-semibold" style={{ color: Colors.charcoal[300] }}>Book</Text>
                              <ChevronRight size={14} color={Colors.charcoal[300]} />
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}

          {activeTab === 'portfolio' && (
            <View>
              {portfolio.length === 0 ? (
                <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>No portfolio projects yet.</Text>
              ) : (
                portfolio.map((item) => {
                  const cat = categories.find((c) => c.id === item.category_id);
                  return (
                    <View key={item.id} className="mb-4 overflow-hidden rounded-2xl" style={{ backgroundColor: Colors.charcoal[800] }}>
                      <View className="flex-row">
                        {[
                          { label: 'Before', uri: item.before_image_url, color: Colors.white },
                          { label: 'After', uri: item.after_image_url, color: Colors.accent[500] },
                        ].map((img) => (
                          <Pressable key={img.label} className="flex-1" onPress={() => setViewer({ uri: img.uri, caption: `${item.title} — ${img.label}` })}>
                            <Image source={{ uri: img.uri }} className="h-40 w-full" resizeMode="cover" />
                            <View className="absolute left-2 top-2 rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                              <Text className="text-[10px] font-semibold" style={{ color: img.color }}>{img.label}</Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                      <View className="p-3">
                        <Text className="text-sm font-semibold text-white">{item.title}</Text>
                        {!!item.description && (
                          <Text className="mt-1 text-xs" style={{ color: Colors.charcoal[400] }}>{item.description}</Text>
                        )}
                        <View className="mt-2 flex-row flex-wrap items-center gap-2">
                          <Text className="text-[11px] font-medium" style={{ color: Colors.charcoal[300] }}>
                            {[item.vehicle_year, item.vehicle_make, item.vehicle_model].filter(Boolean).join(' ')}
                          </Text>
                          {cat && <Badge label={cat.name} color={cat.color} />}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View>
              {reviews.length > 0 && (
                <View className="mb-4 flex-row items-center gap-4 rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-white">{shop.rating.toFixed(1)}</Text>
                    <RatingStars rating={shop.rating} size={12} />
                    <Text className="mt-1 text-[10px]" style={{ color: Colors.charcoal[400] }}>{shop.review_count} reviews</Text>
                  </View>
                  <View className="flex-1 gap-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => Math.round(r.rating) === star).length;
                      const pct = (count / reviews.length) * 100;
                      return (
                        <View key={star} className="flex-row items-center gap-2">
                          <Text className="w-3 text-[10px]" style={{ color: Colors.charcoal[400] }}>{star}</Text>
                          <Star size={8} color={Colors.accent[500]} fill={Colors.accent[500]} strokeWidth={0} />
                          <View className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: Colors.charcoal[700] }}>
                            <View className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: Colors.accent[500] }} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
              {canTransact && (
                <View className="mb-4">
                  <Button
                    label={myReview ? 'Edit your review' : 'Write a review'}
                    variant="outline"
                    fullWidth
                    onPress={gated('Sign in to review this shop.', () => router.push(`/shop/${shop.id}/review`))}
                  />
                </View>
              )}
              {reviews.length === 0 ? (
                <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>No reviews yet. Be the first to review!</Text>
              ) : (
                reviews.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    isOwn={rev.user_id === userId}
                    onEdit={() => router.push(`/shop/${shop.id}/review`)}
                    onReport={() => reportReview(rev.id)}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'about' && (
            <View className="gap-4">
              {!!shop.description && (
                <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                  <Text className="text-sm font-semibold text-white">About</Text>
                  <Text className="mt-2 text-sm leading-5" style={{ color: Colors.charcoal[300] }}>
                    {shop.description}
                  </Text>
                </View>
              )}

              <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                <Text className="mb-3 text-sm font-semibold text-white">Contact</Text>
                <View className="gap-3">
                  <Pressable onPress={() => run(callPhone(shop.phone))} className="flex-row items-center gap-3">
                    <Phone size={16} color={Colors.charcoal[400]} />
                    <Text className="text-sm" style={{ color: Colors.charcoal[200] }}>{shop.phone}</Text>
                  </Pressable>
                  {shop.email && (
                    <Pressable onPress={() => run(sendEmail(shop.email!, `Enquiry via AutoMod`))} className="flex-row items-center gap-3">
                      <Mail size={16} color={Colors.charcoal[400]} />
                      <Text className="text-sm" style={{ color: Colors.charcoal[200] }}>{shop.email}</Text>
                    </Pressable>
                  )}
                  {shop.website && (
                    <Pressable onPress={() => run(openWebsite(shop.website!))} className="flex-row items-center gap-3">
                      <Globe size={16} color={Colors.charcoal[400]} />
                      <Text className="text-sm" style={{ color: Colors.electric[400] }}>{shop.website.replace(/^https?:\/\//, '')}</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => run(openDirections(shop.latitude, shop.longitude, shop.name))} className="flex-row items-center gap-3">
                    <MapPin size={16} color={Colors.charcoal[400]} />
                    <Text className="flex-1 text-sm" style={{ color: Colors.charcoal[200] }}>
                      {shop.address}, {shop.city}{shop.postcode ? ` ${shop.postcode}` : ''}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                <View className="flex-row items-center gap-2">
                  <Clock size={16} color={Colors.charcoal[400]} />
                  <Text className="text-sm font-semibold text-white">Opening Hours</Text>
                </View>
                {shop.opening_hours.length === 0 ? (
                  <Text className="mt-3 text-sm" style={{ color: Colors.charcoal[400] }}>Contact the shop for opening times.</Text>
                ) : (
                  <View className="mt-3 gap-2">
                    {shop.opening_hours.map((h) => {
                      const today = h.day === todayKey;
                      return (
                        <View key={h.day} className="flex-row items-center justify-between">
                          <Text className={`text-sm ${today ? 'font-bold text-white' : ''}`} style={today ? undefined : { color: Colors.charcoal[300] }}>
                            {h.day}{today ? ' (today)' : ''}
                          </Text>
                          <Text className={`text-sm ${today ? 'font-bold' : ''}`} style={{ color: h.closed ? Colors.error[500] : Colors.charcoal[200] }}>
                            {h.closed ? 'Closed' : `${formatTime(h.open)} – ${formatTime(h.close)}`}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {shopCats.length > 0 && (
                <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                  <Text className="mb-3 text-sm font-semibold text-white">Specialisations</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {shopCats.map((cat) => (
                      <Badge key={cat.id} label={cat.name} color={cat.color} />
                    ))}
                  </View>
                </View>
              )}

              {shop.vehicle_brands.length > 0 && (
                <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                  <Text className="mb-3 text-sm font-semibold text-white">Vehicle Brands</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {shop.vehicle_brands.map((brand) => (
                      <View key={brand} className="rounded-full px-3 py-1.5" style={{ backgroundColor: Colors.charcoal[700] }}>
                        <Text className="text-xs font-medium" style={{ color: Colors.charcoal[200] }}>{brand}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {images.length > 0 && (
                <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                  <Text className="mb-3 text-sm font-semibold text-white">Gallery</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {images.map((img) => (
                      <Pressable key={img.id} className="w-[31.5%]" onPress={() => setViewer({ uri: img.image_url, caption: img.caption })}>
                        <Image source={{ uri: img.image_url }} className="h-24 w-full rounded-lg" resizeMode="cover" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom booking bar */}
      {canTransact && (
        <View
          className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 px-5 pt-4"
          style={{
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: Colors.charcoal[900],
            borderTopColor: Colors.charcoal[800],
            borderTopWidth: 1,
          }}>
          <View className="flex-1">
            <Text className="text-[10px]" style={{ color: Colors.charcoal[400] }}>Starting from</Text>
            <Text className="text-lg font-bold" style={{ color: Colors.accent[500] }}>
              {shop.min_price !== null ? formatPrice(shop.min_price) : 'On request'}
            </Text>
          </View>
          <View className="flex-[2]">
            <Button
              label="Book Appointment"
              fullWidth
              size="md"
              onPress={gated('Sign in to book an appointment.', () => router.push(`/shop/${shop.id}/book`))}
            />
          </View>
        </View>
      )}

      <ImageViewer uri={viewer?.uri ?? null} caption={viewer?.caption} onClose={() => setViewer(null)} />
    </View>
  );
}
