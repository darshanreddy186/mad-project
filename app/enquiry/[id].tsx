import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/config';
import { ENQUIRY_STATUS } from '@/constants/status';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { closeEnquiry, getEnquiry, respondToEnquiry } from '@/api/enquiries';
import { subscribeToRow } from '@/api/realtime';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { formatDate, formatPrice, timeAgo } from '@/lib/format';
import { callPhone, sendEmail } from '@/lib/linking';
import { parseAmount } from '@/lib/validation';

function Bubble({ from, children, align }: { from: string; children: React.ReactNode; align: 'left' | 'right' }) {
  return (
    <View className={`max-w-[88%] ${align === 'right' ? 'self-end' : 'self-start'}`}>
      <Text className={`mb-1 text-[11px] ${align === 'right' ? 'text-right' : ''}`} style={{ color: Colors.charcoal[500] }}>
        {from}
      </Text>
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: align === 'right' ? `${Colors.accent[600]}30` : Colors.charcoal[800] }}>
        {children}
      </View>
    </View>
  );
}

export default function EnquiryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [reply, setReply] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState<'reply' | 'close' | null>(null);

  const { data: enquiry, loading, error, refresh, refreshing, refetch } = useQuery(() => getEnquiry(id), [id], {
    enabled: Boolean(id && userId),
    refetchOnFocus: true,
  });

  useEffect(() => (id ? subscribeToRow('enquiries', id, refetch) : undefined), [id, refetch]);
  useEffect(() => {
    setReply(enquiry?.response ?? '');
    setPrice(enquiry?.quoted_price != null ? String(enquiry.quoted_price) : '');
  }, [enquiry?.response, enquiry?.quoted_price]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={refresh} />;
  if (!enquiry) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <ScreenHeader title="Enquiry" />
        <EmptyState title="Enquiry not found" />
      </SafeAreaView>
    );
  }

  const isCustomer = enquiry.user_id === userId;
  const isQuote = enquiry.type === 'quote';
  const status = ENQUIRY_STATUS[enquiry.status];
  const vehicle = [enquiry.vehicle_year, enquiry.vehicle_make, enquiry.vehicle_model].filter(Boolean).join(' ');
  const closed = enquiry.status === 'closed';

  const sendReply = async () => {
    const amount = parseAmount(price);
    if (!reply.trim()) return toast.error('Write a reply first.');
    if (Number.isNaN(amount)) return toast.error('Enter a valid quote amount.');
    setBusy('reply');
    try {
      await respondToEnquiry(enquiry.id, reply, isQuote ? amount : null);
      toast.success('Reply sent to the customer.');
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const close = async () => {
    if (!(await confirm('Close enquiry', 'Mark this enquiry as closed?', { confirmText: 'Close' }))) return;
    setBusy('close');
    try {
      await closeEnquiry(enquiry.id);
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title={isQuote ? 'Quote request' : 'Enquiry'} subtitle={isCustomer ? enquiry.shop?.name : enquiry.customer_name} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.accent[500]} />}
          keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center justify-between">
            <StatusBadge label={status.label} color={status.color} />
            <Text className="text-xs" style={{ color: Colors.charcoal[500] }}>{formatDate(enquiry.created_at)}</Text>
          </View>

          <Bubble from={isCustomer ? 'You' : enquiry.customer_name} align={isCustomer ? 'right' : 'left'}>
            <Text className="text-sm font-semibold text-white">{enquiry.subject}</Text>
            <Text className="mt-2 text-sm leading-5" style={{ color: Colors.charcoal[200] }}>{enquiry.message}</Text>
            {(!!vehicle || enquiry.budget !== null) && (
              <View className="mt-3 gap-1">
                {!!vehicle && <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>Vehicle: {vehicle}</Text>}
                {enquiry.budget !== null && (
                  <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>Budget: {formatPrice(enquiry.budget)}</Text>
                )}
              </View>
            )}
          </Bubble>

          {enquiry.response ? (
            <Bubble from={`${isCustomer ? enquiry.shop?.name ?? 'Shop' : 'You'}${enquiry.responded_at ? ` · ${timeAgo(enquiry.responded_at)}` : ''}`} align={isCustomer ? 'left' : 'right'}>
              <Text className="text-sm leading-5" style={{ color: Colors.charcoal[100] }}>{enquiry.response}</Text>
              {enquiry.quoted_price !== null && (
                <View className="mt-3 rounded-xl p-3" style={{ backgroundColor: Colors.charcoal[900] }}>
                  <Text className="text-[11px]" style={{ color: Colors.charcoal[400] }}>Quoted price</Text>
                  <Text className="text-2xl font-bold" style={{ color: Colors.accent[500] }}>{formatPrice(enquiry.quoted_price)}</Text>
                </View>
              )}
            </Bubble>
          ) : (
            isCustomer && (
              <Text className="text-center text-xs" style={{ color: Colors.charcoal[500] }}>
                Waiting for the shop to reply. You&apos;ll get a notification.
              </Text>
            )
          )}

          {!isCustomer && (
            <Card title="Customer contact">
              <View className="gap-2">
                {enquiry.customer_phone && (
                  <Button label={`Call ${enquiry.customer_phone}`} variant="outline" onPress={() => callPhone(enquiry.customer_phone!).catch(() => {})} fullWidth />
                )}
                {enquiry.customer_email && (
                  <Button label={`Email ${enquiry.customer_email}`} variant="outline" onPress={() => sendEmail(enquiry.customer_email!, `Re: ${enquiry.subject}`).catch(() => {})} fullWidth />
                )}
              </View>
            </Card>
          )}

          {!isCustomer && !closed && (
            <Card title={enquiry.response ? 'Update your reply' : 'Reply'}>
              <View className="gap-3">
                <Input value={reply} onChangeText={setReply} placeholder="Write your reply…" multiline numberOfLines={4} maxLength={2000} autoCapitalize="sentences" />
                {isQuote && (
                  <Input label={`Quoted price (${CURRENCY_SYMBOL})`} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="e.g. 1500" />
                )}
                <Button label={isQuote ? 'Send quote' : 'Send reply'} loading={busy === 'reply'} onPress={sendReply} fullWidth />
              </View>
            </Card>
          )}

          <View className="gap-3">
            {isCustomer && isQuote && enquiry.status === 'responded' && (
              <Button
                label="Book this work"
                onPress={() => router.push(`/shop/${enquiry.shop_id}/book${enquiry.service_id ? `?service=${enquiry.service_id}` : ''}`)}
                fullWidth
              />
            )}
            {isCustomer && (
              <Button label="View shop" variant="outline" onPress={() => router.push(`/shop/${enquiry.shop_id}`)} fullWidth />
            )}
            {!closed && <Button label="Close enquiry" variant="ghost" loading={busy === 'close'} onPress={close} fullWidth />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
