import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/config';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Chip, Segments } from '@/components/Chip';
import { ErrorView, LoadingView, EmptyState } from '@/components/StateViews';
import { SignInPrompt } from '@/components/SignInPrompt';
import { getShopWithServices } from '@/api/shops';
import { createEnquiry } from '@/api/enquiries';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { getErrorMessage } from '@/lib/errors';
import { isValid, parseAmount, parseYear, validatePhone, validateRequired } from '@/lib/validation';
import type { EnquiryType } from '@/types';

export default function EnquiryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; type?: string; service?: string }>();
  const profile = useAuthStore((s) => s.profile);

  const { data, loading, error, refresh } = useQuery(() => getShopWithServices(params.id), [params.id], {
    enabled: Boolean(params.id && profile),
  });

  const [type, setType] = useState<EnquiryType>(params.type === 'quote' ? 'quote' : 'general');
  const [serviceId, setServiceId] = useState<string | null>(params.service ?? null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [budget, setBudget] = useState('');
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!profile) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <ScreenHeader title="Contact shop" />
        <SignInPrompt message="Sign in to message shops and request quotes." icon={MessageSquare} />
      </SafeAreaView>
    );
  }
  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={refresh} />;
  if (!data) return <EmptyState title="Shop not found" actionLabel="Go back" onAction={() => router.back()} />;

  const { shop, services } = data;
  const isQuote = type === 'quote';
  const selectedService = services.find((s) => s.id === serviceId);

  const submit = async () => {
    const year = parseYear(vehicleYear);
    const amount = parseAmount(budget);
    const nextErrors = {
      subject: validateRequired(subject, 'Subject', 2),
      message: validateRequired(message, 'Message', 10),
      vehicleMake: isQuote ? validateRequired(vehicleMake, 'Vehicle make') : undefined,
      vehicleModel: isQuote ? validateRequired(vehicleModel, 'Vehicle model') : undefined,
      vehicleYear: Number.isNaN(year) ? 'Enter a valid year' : undefined,
      budget: Number.isNaN(amount) ? 'Enter a valid amount' : undefined,
      name: validateRequired(name, 'Name', 2),
      phone: validatePhone(phone, false),
    };
    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setSubmitting(true);
    try {
      const enquiry = await createEnquiry({
        shop_id: shop.id,
        user_id: profile.id,
        type,
        service_id: selectedService?.id ?? null,
        subject: subject.trim(),
        message: message.trim(),
        vehicle_make: vehicleMake.trim() || null,
        vehicle_model: vehicleModel.trim() || null,
        vehicle_year: year,
        budget: amount,
        customer_name: name.trim(),
        customer_phone: phone.trim() || null,
        customer_email: profile.email,
      });
      toast.success(isQuote ? 'Quote request sent!' : 'Message sent!');
      router.replace(`/enquiry/${enquiry.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title={isQuote ? 'Request a quote' : 'Send an enquiry'} subtitle={shop.name} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Segments
            value={type}
            onChange={setType}
            options={[
              { value: 'general', label: 'General enquiry' },
              { value: 'quote', label: 'Quotation request' },
            ]}
          />

          {services.length > 0 && (
            <>
              <Text className="mb-2 mt-5 text-sm font-medium" style={{ color: Colors.charcoal[200] }}>
                Related service (optional)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {services.map((s) => (
                  <Chip key={s.id} label={s.name} size="sm" selected={serviceId === s.id} onPress={() => setServiceId(serviceId === s.id ? null : s.id)} />
                ))}
              </View>
            </>
          )}

          <View className="mt-5 gap-4">
            <Input label="Subject" value={subject} onChangeText={setSubject} placeholder={isQuote ? 'e.g. Stage 2 tune for Golf R' : 'e.g. Availability next week?'} autoCapitalize="sentences" maxLength={150} error={errors.subject} />
            <Input
              label={isQuote ? 'Describe the work you need' : 'Message'}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              maxLength={2000}
              autoCapitalize="sentences"
              placeholder={isQuote ? 'Current modifications, goals, parts you want supplied…' : 'Write your question…'}
              error={errors.message}
            />

            <Text className="text-sm font-semibold text-white">Vehicle {isQuote ? '' : '(optional)'}</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input label="Make" value={vehicleMake} onChangeText={setVehicleMake} autoCapitalize="words" error={errors.vehicleMake} />
              </View>
              <View className="flex-1">
                <Input label="Model" value={vehicleModel} onChangeText={setVehicleModel} autoCapitalize="words" error={errors.vehicleModel} />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input label="Year" value={vehicleYear} onChangeText={setVehicleYear} keyboardType="number-pad" maxLength={4} error={errors.vehicleYear} />
              </View>
              {isQuote && (
                <View className="flex-1">
                  <Input label={`Budget (${CURRENCY_SYMBOL})`} value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholder="Optional" error={errors.budget} />
                </View>
              )}
            </View>

            <Text className="text-sm font-semibold text-white">Contact details</Text>
            <Input label="Name" value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} />
            <Input label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
          </View>

          <View className="mt-6">
            <Button label={isQuote ? 'Request quote' : 'Send enquiry'} onPress={submit} loading={submitting} fullWidth size="lg" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
