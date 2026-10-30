import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle2, MapPin } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { PRICE_LEVELS } from '@/constants/config';
import { POPULAR_BRANDS } from '@/constants/images';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { OpeningHoursEditor } from '@/components/OpeningHoursEditor';
import { TagInput } from '@/components/TagInput';
import { LocationPickerModal } from '@/components/LocationPickerModal';
import { createShop, resubmitShop, updateShop, type ShopInput } from '@/api/shops';
import { useAuthStore } from '@/store/useAuthStore';
import { useOwnerStore } from '@/store/useOwnerStore';
import { toast } from '@/store/useToastStore';
import { getErrorMessage } from '@/lib/errors';
import { priceLevelSymbols } from '@/lib/format';
import { DEFAULT_OPENING_HOURS, validateOpeningHours } from '@/lib/schedule';
import {
  isValid,
  normalizeWebsite,
  validateEmail,
  validatePhone,
  validateRequired,
} from '@/lib/validation';
import type { Coordinates, OpeningHours, PriceLevel } from '@/types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="mb-3 text-sm font-semibold" style={{ color: Colors.charcoal[400] }}>{title}</Text>
      <View className="gap-4">{children}</View>
    </View>
  );
}

export default function ShopFormScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile)!;
  const { shop, setShop } = useOwnerStore();
  const isNew = !shop;

  const [name, setName] = useState(shop?.name ?? '');
  const [description, setDescription] = useState(shop?.description ?? '');
  const [address, setAddress] = useState(shop?.address ?? '');
  const [city, setCity] = useState(shop?.city ?? '');
  const [postcode, setPostcode] = useState(shop?.postcode ?? '');
  const [phone, setPhone] = useState(shop?.phone ?? profile.phone ?? '');
  const [email, setEmail] = useState(shop?.email ?? profile.email ?? '');
  const [website, setWebsite] = useState(shop?.website ?? '');
  const [priceLevel, setPriceLevel] = useState<PriceLevel>(shop?.price_level ?? 2);
  const [hours, setHours] = useState<OpeningHours[]>(
    shop?.opening_hours.length ? shop.opening_hours : DEFAULT_OPENING_HOURS
  );
  const [brands, setBrands] = useState<string[]>(shop?.vehicle_brands ?? []);
  const [coords, setCoords] = useState<Coordinates | null>(
    shop ? { latitude: shop.latitude, longitude: shop.longitude } : null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const nextErrors = {
      name: validateRequired(name, 'Shop name', 2),
      description: validateRequired(description, 'Description', 20),
      address: validateRequired(address, 'Address', 3),
      city: validateRequired(city, 'City', 2),
      phone: validatePhone(phone),
      email: email.trim() ? validateEmail(email) : undefined,
      location: coords ? undefined : 'Set your shop location on the map',
      hours: validateOpeningHours(hours),
    };
    setErrors(nextErrors);
    if (!isValid(nextErrors) || !coords) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    const input: ShopInput = {
      name: name.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      postcode: postcode.trim() || null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      phone: phone.trim(),
      email: email.trim() || null,
      website: normalizeWebsite(website),
      price_level: priceLevel,
      opening_hours: hours,
      vehicle_brands: brands,
    };

    setSaving(true);
    try {
      if (isNew) {
        const created = await createShop(profile.id, input);
        setShop(created);
        toast.success('Shop submitted for review! Now add your services and photos.');
        router.replace('/owner');
      } else {
        let updated = await updateShop(shop.id, input);
        if (updated.status === 'rejected') {
          await resubmitShop(shop.id);
          updated = { ...updated, status: 'pending', rejection_reason: null };
          toast.success('Changes saved and resubmitted for review.');
        } else {
          toast.success('Shop details saved.');
        }
        setShop(updated);
        router.back();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title={isNew ? 'Register your shop' : 'Shop details'} subtitle={isNew ? 'Step 1 of 2 — details & location' : shop.name} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Section title="ABOUT YOUR SHOP">
            <Input label="Shop name" value={name} onChangeText={setName} autoCapitalize="words" maxLength={100} error={errors.name} />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              maxLength={2000}
              autoCapitalize="sentences"
              placeholder="What do you specialise in? Experience, certifications, equipment…"
              error={errors.description}
            />
            <View>
              <Text className="mb-2 text-sm font-medium" style={{ color: Colors.charcoal[200] }}>Price level</Text>
              <View className="flex-row gap-2">
                {PRICE_LEVELS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPriceLevel(p)}
                    className="flex-1 items-center rounded-xl py-3"
                    style={{ backgroundColor: priceLevel === p ? Colors.accent[600] : Colors.charcoal[800] }}>
                    <Text className="text-sm font-bold" style={{ color: priceLevel === p ? Colors.white : Colors.charcoal[300] }}>
                      {priceLevelSymbols(p)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Section>

          <Section title="LOCATION">
            <Input label="Street address" value={address} onChangeText={setAddress} autoCapitalize="words" error={errors.address} />
            <View className="flex-row gap-3">
              <View className="flex-[2]">
                <Input label="City" value={city} onChangeText={setCity} autoCapitalize="words" error={errors.city} />
              </View>
              <View className="flex-1">
                <Input label="Postcode" value={postcode} onChangeText={setPostcode} autoCapitalize="none" />
              </View>
            </View>
            <Pressable
              onPress={() => setPickerOpen(true)}
              className="flex-row items-center gap-3 rounded-xl p-4"
              style={{
                backgroundColor: Colors.charcoal[800],
                borderWidth: 1,
                borderColor: errors.location ? Colors.error[500] : coords ? `${Colors.success[500]}60` : Colors.charcoal[700],
              }}>
              {coords ? <CheckCircle2 size={20} color={Colors.success[500]} /> : <MapPin size={20} color={Colors.accent[500]} />}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-white">{coords ? 'Map location set' : 'Set location on map'}</Text>
                <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
                  {coords
                    ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} — tap to adjust`
                    : 'Customers use this for distance and directions'}
                </Text>
              </View>
            </Pressable>
            {errors.location && <Text className="-mt-2 text-xs" style={{ color: Colors.error[500] }}>{errors.location}</Text>}
          </Section>

          <Section title="CONTACT">
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
            <Input label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" error={errors.email} />
            <Input label="Website (optional)" value={website} onChangeText={setWebsite} keyboardType="url" placeholder="www.example.com" />
          </Section>

          <Section title="OPENING HOURS">
            <OpeningHoursEditor value={hours} onChange={setHours} />
            {errors.hours && <Text className="-mt-2 text-xs" style={{ color: Colors.error[500] }}>{errors.hours}</Text>}
          </Section>

          <Section title="VEHICLE BRANDS YOU WORK ON">
            <TagInput value={brands} onChange={setBrands} placeholder="Add a brand…" suggestions={POPULAR_BRANDS} />
          </Section>

          <View className="mt-8">
            <Button
              label={isNew ? 'Submit for review' : shop.status === 'rejected' ? 'Save & resubmit' : 'Save changes'}
              onPress={save}
              loading={saving}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LocationPickerModal
        visible={pickerOpen}
        title="Shop location"
        initial={coords}
        initialQuery={[address, city, postcode].filter(Boolean).join(', ')}
        onClose={() => setPickerOpen(false)}
        onConfirm={(c) => {
          setCoords(c);
          setErrors((e) => ({ ...e, location: undefined }));
          setPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}
