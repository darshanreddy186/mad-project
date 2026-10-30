import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarCheck, Check } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { ErrorView, LoadingView, EmptyState } from '@/components/StateViews';
import { SignInPrompt } from '@/components/SignInPrompt';
import { getShopWithServices } from '@/api/shops';
import { createBooking, listTakenSlots } from '@/api/bookings';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { formatPriceRange, toISODate } from '@/lib/format';
import { generateTimeSlots, upcomingDates } from '@/lib/schedule';
import { getErrorMessage } from '@/lib/errors';
import { isValid, parseYear, validatePhone, validateRequired } from '@/lib/validation';

const GENERAL_SERVICE = '__general__';

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <View className="mb-3 mt-6 flex-row items-center gap-2">
      <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: Colors.accent[600] }}>
        <Text className="text-xs font-bold text-white">{step}</Text>
      </View>
      <Text className="text-base font-semibold text-white">{title}</Text>
    </View>
  );
}

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { id, service } = useLocalSearchParams<{ id: string; service?: string }>();
  const profile = useAuthStore((s) => s.profile);

  const { data, loading, error, refresh } = useQuery(() => getShopWithServices(id), [id], {
    enabled: Boolean(id && profile),
  });

  const dates = useMemo(() => upcomingDates(21), []);
  const [serviceId, setServiceId] = useState<string>(service ?? '');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  const hours = data?.shop.opening_hours ?? [];

  // Default to the first service and the first open day.
  useEffect(() => {
    if (!data) return;
    if (!serviceId) setServiceId(data.services[0]?.id ?? GENERAL_SERVICE);
    if (!date) setDate(dates.find((d) => generateTimeSlots(hours, d).length > 0) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (!date || !id) return;
    setTime(null);
    let active = true;
    listTakenSlots(id, toISODate(date)).then((t) => active && setTaken(t));
    return () => {
      active = false;
    };
  }, [date, id]);

  if (!profile) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <ScreenHeader title="Book appointment" />
        <SignInPrompt message="Sign in to book appointments with shops." icon={CalendarCheck} />
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={refresh} />;
  if (!data) {
    return <EmptyState title="Shop not found" actionLabel="Go back" onAction={() => router.back()} />;
  }

  const { shop, services } = data;
  const slots = date ? generateTimeSlots(hours, date) : [];
  const selectedService = services.find((s) => s.id === serviceId);

  const submit = async () => {
    const year = parseYear(vehicleYear);
    const nextErrors = {
      date: date ? undefined : 'Choose a date',
      time: time ? undefined : 'Choose a time',
      vehicleMake: validateRequired(vehicleMake, 'Vehicle make'),
      vehicleModel: validateRequired(vehicleModel, 'Vehicle model'),
      vehicleYear: Number.isNaN(year) ? 'Enter a valid year' : undefined,
      name: validateRequired(name, 'Name', 2),
      phone: validatePhone(phone),
    };
    setErrors(nextErrors);
    if (!isValid(nextErrors) || !date || !time) {
      toast.error('Please complete the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({
        shop_id: shop.id,
        user_id: profile.id,
        service_id: selectedService?.id ?? null,
        service_name: selectedService?.name ?? 'General consultation',
        booking_date: toISODate(date),
        booking_time: time,
        vehicle_make: vehicleMake.trim(),
        vehicle_model: vehicleModel.trim(),
        vehicle_year: year,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        notes: notes.trim() || null,
      });
      toast.success('Booking requested! The shop will confirm shortly.');
      router.replace(`/booking/${booking.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      if (date) listTakenSlots(shop.id, toISODate(date)).then(setTaken);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Book appointment" subtitle={shop.name} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <SectionTitle step={1} title="Service" />
          <View className="gap-2">
            {[...services, null].map((svc) => {
              const value = svc?.id ?? GENERAL_SERVICE;
              const selected = serviceId === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setServiceId(value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className="flex-row items-center gap-3 rounded-xl p-3.5"
                  style={{
                    backgroundColor: Colors.charcoal[800],
                    borderWidth: 1.5,
                    borderColor: selected ? Colors.accent[500] : 'transparent',
                  }}>
                  <View
                    className="h-5 w-5 items-center justify-center rounded-full"
                    style={{ borderWidth: 2, borderColor: selected ? Colors.accent[500] : Colors.charcoal[500] }}>
                    {selected && <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: Colors.accent[500] }} />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-white">{svc?.name ?? 'General consultation'}</Text>
                    {!svc && (
                      <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
                        Not sure what you need? Book an assessment.
                      </Text>
                    )}
                  </View>
                  {svc && (
                    <Text className="text-sm font-bold" style={{ color: Colors.accent[500] }}>
                      {formatPriceRange(svc.price_from, svc.price_to)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <SectionTitle step={2} title="Date" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {dates.map((d) => {
              const open = generateTimeSlots(hours, d).length > 0;
              const selected = date?.toDateString() === d.toDateString();
              return (
                <Pressable
                  key={d.toISOString()}
                  disabled={!open}
                  onPress={() => setDate(d)}
                  accessibilityLabel={d.toDateString()}
                  accessibilityState={{ selected, disabled: !open }}
                  className="w-16 items-center rounded-2xl py-3"
                  style={{
                    backgroundColor: selected ? Colors.accent[600] : Colors.charcoal[800],
                    opacity: open ? 1 : 0.35,
                  }}>
                  <Text className="text-[11px]" style={{ color: selected ? Colors.white : Colors.charcoal[400] }}>
                    {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </Text>
                  <Text className="mt-1 text-lg font-bold text-white">{d.getDate()}</Text>
                  <Text className="text-[10px]" style={{ color: selected ? Colors.white : Colors.charcoal[400] }}>
                    {d.toLocaleDateString('en-GB', { month: 'short' })}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {errors.date && <Text className="mt-2 text-xs" style={{ color: Colors.error[500] }}>{errors.date}</Text>}

          <SectionTitle step={3} title="Time" />
          {!date ? (
            <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>Choose a date first.</Text>
          ) : slots.length === 0 ? (
            <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>No times available on this day.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {slots.map((slot) => {
                const isTaken = taken.includes(slot);
                const selected = time === slot;
                return (
                  <Pressable
                    key={slot}
                    disabled={isTaken}
                    onPress={() => setTime(slot)}
                    accessibilityState={{ selected, disabled: isTaken }}
                    className="w-[23%] items-center rounded-xl py-2.5"
                    style={{
                      backgroundColor: selected ? Colors.accent[600] : Colors.charcoal[800],
                      opacity: isTaken ? 0.35 : 1,
                    }}>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: selected ? Colors.white : Colors.charcoal[200], textDecorationLine: isTaken ? 'line-through' : 'none' }}>
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {errors.time && <Text className="mt-2 text-xs" style={{ color: Colors.error[500] }}>{errors.time}</Text>}

          <SectionTitle step={4} title="Your vehicle" />
          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input label="Make" value={vehicleMake} onChangeText={setVehicleMake} placeholder="BMW" autoCapitalize="words" error={errors.vehicleMake} />
              </View>
              <View className="flex-1">
                <Input label="Model" value={vehicleModel} onChangeText={setVehicleModel} placeholder="M340i" autoCapitalize="words" error={errors.vehicleModel} />
              </View>
            </View>
            <Input label="Year (optional)" value={vehicleYear} onChangeText={setVehicleYear} placeholder="2021" keyboardType="number-pad" maxLength={4} error={errors.vehicleYear} />
          </View>

          <SectionTitle step={5} title="Contact details" />
          <View className="gap-3">
            <Input label="Name" value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
            <Input
              label="Notes for the shop (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything the shop should know?"
              multiline
              numberOfLines={3}
              maxLength={1000}
              autoCapitalize="sentences"
            />
          </View>

          <View className="mt-6 rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
            <View className="flex-row items-center gap-2">
              <Check size={16} color={Colors.success[500]} />
              <Text className="flex-1 text-xs" style={{ color: Colors.charcoal[300] }}>
                This is a booking request. {shop.name} will confirm or suggest changes, and you&apos;ll be notified.
              </Text>
            </View>
          </View>

          <View className="mt-6">
            <Button label="Request booking" onPress={submit} loading={submitting} fullWidth size="lg" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
