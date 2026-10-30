import { View, Text, ScrollView, Image, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Heart,
  BadgeCheck,
  ChevronRight,
  Camera,
  Wrench,
  Star,
} from 'lucide-react-native';
import { useState } from 'react';
import { Colors } from '@/constants/theme';
import { SHOPS, SHOP_SERVICES, REVIEWS, PORTFOLIO, CATEGORIES, GALLERY_IMAGES } from '@/data/mockData';
import { RatingStars } from '@/components/RatingStars';
import { ReviewCard } from '@/components/ReviewCard';
import { PriceLevel, Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';

type Tab = 'services' | 'portfolio' | 'reviews' | 'about';

export default function ShopDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('services');

  const shop = SHOPS.find((s) => s.id === id);
  const isFav = useAppStore((s) => s.favourites.includes(id));
  const toggleFavourite = useAppStore((s) => s.toggleFavourite);

  if (!shop) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.charcoal[950] }}>
        <Text className="text-base text-white">Shop not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text style={{ color: Colors.accent[500] }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const services = SHOP_SERVICES.filter((s) => s.shop_id === shop.id);
  const reviews = REVIEWS.filter((r) => r.shop_id === shop.id);
  const portfolio = PORTFOLIO.filter((p) => p.shop_id === shop.id);
  const shopCats = shop.categories
    .map((slug) => CATEGORIES.find((c) => c.slug === slug))
    .filter(Boolean);

  const callShop = () => Linking.openURL(`tel:${shop.phone}`);
  const getDirections = () => {
    const url = `https://maps.google.com/?q=${shop.latitude},${shop.longitude}`;
    Linking.openURL(url);
  };
  const shareShop = async () => {
    try {
      await Linking.openURL(
        `https://maps.google.com/?q=${shop.latitude},${shop.longitude}`
      );
    } catch {
      // Share not available
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'services', label: 'Services' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'reviews', label: `Reviews (${reviews.length})` },
    { key: 'about', label: 'About' },
  ];

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Cover image */}
        <View className="relative h-56 w-full">
          <Image source={{ uri: shop.cover_image_url }} className="h-full w-full" resizeMode="cover" />
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(15,17,21,0.4)' }} />

          {/* Top bar */}
          <View className="absolute top-3 left-0 right-0 flex-row items-center justify-between px-4">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(15,17,21,0.7)' }}>
              <ArrowLeft size={20} color={Colors.white} />
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable
                onPress={shareShop}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(15,17,21,0.7)' }}>
                <Share2 size={18} color={Colors.white} />
              </Pressable>
              <Pressable
                onPress={() => toggleFavourite(shop.id)}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(15,17,21,0.7)' }}>
                <Heart
                  size={18}
                  color={isFav ? Colors.accent[500] : Colors.white}
                  fill={isFav ? Colors.accent[500] : 'none'}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Shop header */}
        <View className="px-5 pt-4">
          <View className="flex-row items-center gap-2">
            {shop.is_verified && (
              <View className="flex-row items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: `${Colors.electric[500]}20` }}>
                <BadgeCheck size={12} color={Colors.electric[400]} />
                <Text className="text-[10px] font-semibold" style={{ color: Colors.electric[400] }}>Verified</Text>
              </View>
            )}
            <PriceLevel level={shop.price_level} />
          </View>
          <Text className="mt-2 text-2xl font-bold text-white">{shop.name}</Text>
          <View className="mt-1.5 flex-row items-center gap-2">
            <MapPin size={14} color={Colors.charcoal[400]} />
            <Text className="text-sm" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
              {shop.address}, {shop.city} · {shop.distance?.toFixed(1)}mi away
            </Text>
          </View>
          <View className="mt-3 flex-row items-center gap-3">
            <RatingStars rating={shop.rating} size={16} showValue reviewCount={shop.review_count} />
          </View>

          {/* Quick actions */}
          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={callShop}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3"
              style={{ backgroundColor: Colors.charcoal[800] }}>
              <Phone size={16} color={Colors.accent[500]} />
              <Text className="text-sm font-semibold text-white">Call</Text>
            </Pressable>
            <Pressable
              onPress={getDirections}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3"
              style={{ backgroundColor: Colors.charcoal[800] }}>
              <Navigation size={16} color={Colors.electric[400]} />
              <Text className="text-sm font-semibold text-white">Directions</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/shop/${shop.id}/enquiry`)}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3"
              style={{ backgroundColor: Colors.charcoal[800] }}>
              <Mail size={16} color={Colors.success[500]} />
              <Text className="text-sm font-semibold text-white">Enquire</Text>
            </Pressable>
          </View>
        </View>

        {/* Tabs */}
        <View className="mt-5 px-5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
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
                  const cat = CATEGORIES.find((c) => c.id === svc.category_id);
                  return (
                    <Pressable
                      key={svc.id}
                      onPress={() => router.push(`/shop/${shop.id}/book`)}
                      className="mb-3 rounded-2xl p-4"
                      style={{ backgroundColor: Colors.charcoal[800] }}>
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-white">{svc.name}</Text>
                          <Text className="mt-1 text-xs" style={{ color: Colors.charcoal[400] }} numberOfLines={2}>
                            {svc.description}
                          </Text>
                          {cat && (
                            <View className="mt-2">
                              <Badge label={cat.name} color={cat.color} />
                            </View>
                          )}
                        </View>
                        <View className="items-end">
                          <Text className="text-base font-bold" style={{ color: Colors.accent[500] }}>
                            £{svc.price_from}
                          </Text>
                          <Text className="text-[10px]" style={{ color: Colors.charcoal[500] }}>
                            from / {svc.unit}
                          </Text>
                          <View className="mt-2 flex-row items-center gap-0.5">
                            <ChevronRight size={14} color={Colors.charcoal[400]} />
                            <Text className="text-[10px] font-medium" style={{ color: Colors.charcoal[400] }}>Book</Text>
                          </View>
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
                <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>No portfolio items yet.</Text>
              ) : (
                portfolio.map((item) => (
                  <View key={item.id} className="mb-4 overflow-hidden rounded-2xl" style={{ backgroundColor: Colors.charcoal[800] }}>
                    <View className="flex-row">
                      <View className="flex-1">
                        <Text className="absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                          Before
                        </Text>
                        <Image source={{ uri: item.before_image_url }} className="h-40" resizeMode="cover" />
                      </View>
                      <View className="flex-1">
                        <Text className="absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium" style={{ color: Colors.accent[500] }}>
                          After
                        </Text>
                        <Image source={{ uri: item.after_image_url }} className="h-40" resizeMode="cover" />
                      </View>
                    </View>
                    <View className="p-3">
                      <Text className="text-sm font-semibold text-white">{item.title}</Text>
                      <Text className="mt-1 text-xs" style={{ color: Colors.charcoal[400] }}>{item.description}</Text>
                      <Text className="mt-2 text-[10px] font-medium" style={{ color: Colors.charcoal[500] }}>
                        {item.vehicle_make} {item.vehicle_model}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View>
              {reviews.length === 0 ? (
                <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>No reviews yet.</Text>
              ) : (
                <>
                  <View className="mb-4 flex-row items-center gap-4 rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                    <View className="items-center">
                      <Text className="text-3xl font-bold text-white">{shop.rating.toFixed(1)}</Text>
                      <RatingStars rating={shop.rating} size={12} />
                      <Text className="mt-1 text-[10px]" style={{ color: Colors.charcoal[400] }}>{shop.review_count} reviews</Text>
                    </View>
                    <View className="flex-1 gap-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => Math.round(r.rating) === star).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
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
                  {reviews.map((rev) => (
                    <ReviewCard key={rev.id} review={rev} />
                  ))}
                  <View className="mt-2">
                    <Button label="Write a Review" variant="outline" fullWidth onPress={() => router.push(`/shop/${shop.id}/review`)} />
                  </View>
                </>
              )}
            </View>
          )}

          {activeTab === 'about' && (
            <View className="gap-4">
              <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                <Text className="text-sm font-semibold text-white">About</Text>
                <Text className="mt-2 text-sm leading-5" style={{ color: Colors.charcoal[300] }}>
                  {shop.description}
                </Text>
              </View>

              <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                <Text className="mb-3 text-sm font-semibold text-white">Contact</Text>
                <View className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <Phone size={16} color={Colors.charcoal[400]} />
                    <Text className="text-sm" style={{ color: Colors.charcoal[200] }}>{shop.phone}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Mail size={16} color={Colors.charcoal[400]} />
                    <Text className="text-sm" style={{ color: Colors.charcoal[200] }}>{shop.email}</Text>
                  </View>
                  {shop.website && (
                    <View className="flex-row items-center gap-3">
                      <Globe size={16} color={Colors.charcoal[400]} />
                      <Text className="text-sm" style={{ color: Colors.charcoal[200] }}>{shop.website}</Text>
                    </View>
                  )}
                  <View className="flex-row items-center gap-3">
                    <MapPin size={16} color={Colors.charcoal[400]} />
                    <Text className="flex-1 text-sm" style={{ color: Colors.charcoal[200] }}>{shop.address}, {shop.city}</Text>
                  </View>
                </View>
              </View>

              <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                <View className="flex-row items-center gap-2">
                  <Clock size={16} color={Colors.charcoal[400]} />
                  <Text className="text-sm font-semibold text-white">Opening Hours</Text>
                </View>
                <View className="mt-3 gap-2">
                  {shop.opening_hours.map((h) => (
                    <View key={h.day} className="flex-row items-center justify-between">
                      <Text className="text-sm" style={{ color: Colors.charcoal[300] }}>{h.day}</Text>
                      <Text className="text-sm" style={{ color: h.closed ? Colors.error[500] : Colors.charcoal[200] }}>
                        {h.closed ? 'Closed' : `${h.open} - ${h.close}`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                <Text className="mb-3 text-sm font-semibold text-white">Specialisations</Text>
                <View className="flex-row flex-wrap gap-2">
                  {shopCats.map((cat) => cat && (
                    <Badge key={cat.id} label={cat.name} color={cat.color} />
                  ))}
                </View>
              </View>

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

              <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                <Text className="mb-3 text-sm font-semibold text-white">Gallery</Text>
                <View className="flex-row flex-wrap gap-2">
                  {GALLERY_IMAGES.slice(0, 6).map((img, i) => (
                    <Image key={i} source={{ uri: img }} className="h-20 w-[31%] rounded-lg" resizeMode="cover" />
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom booking bar */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 px-5 pb-6 pt-4"
        style={{ backgroundColor: Colors.charcoal[900], borderTopColor: Colors.charcoal[800], borderTopWidth: 1 }}>
        <View className="flex-1">
          <Text className="text-[10px]" style={{ color: Colors.charcoal[400] }}>Starting from</Text>
          <Text className="text-lg font-bold" style={{ color: Colors.accent[500] }}>
            £{services.length > 0 ? Math.min(...services.map((s) => s.price_from)) : '---'}
          </Text>
        </View>
        <View className="flex-[2]">
          <Button label="Book Appointment" fullWidth size="md" onPress={() => router.push(`/shop/${shop.id}/book`)} />
        </View>
      </View>
    </SafeAreaView>
  );
}
