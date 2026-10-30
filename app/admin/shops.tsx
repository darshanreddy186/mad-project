import { useState } from 'react';
import { FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, Phone, Search, Store } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { SHOP_STATUS } from '@/constants/status';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Segments } from '@/components/Chip';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ModalSheet } from '@/components/ModalSheet';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { listShopsByStatus, setShopStatus, setShopVerified } from '@/api/shops';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@/hooks/useQuery';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import type { Shop, ShopStatus } from '@/types';

type Filter = ShopStatus | 'all';

export default function AdminShopsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: Filter }>();
  const [status, setStatus] = useState<Filter>(params.status ?? 'pending');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [rejecting, setRejecting] = useState<Shop | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const { data, loading, error, refresh, refreshing, refetch } = useQuery(
    () => listShopsByStatus(status, debounced),
    [status, debounced],
    { refetchOnFocus: true }
  );

  const run = async (shop: Shop, key: string, action: () => Promise<void>, message: string) => {
    setBusy(`${shop.id}:${key}`);
    try {
      await action();
      toast.success(message);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const approve = (shop: Shop) => run(shop, 'approve', () => setShopStatus(shop.id, 'approved'), `${shop.name} approved.`);

  const suspend = async (shop: Shop) => {
    if (!(await confirm('Suspend shop', `Hide ${shop.name} from customers?`, { confirmText: 'Suspend', destructive: true }))) return;
    run(shop, 'suspend', () => setShopStatus(shop.id, 'suspended'), 'Shop suspended.');
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    if (reason.trim().length < 5) return toast.error('Give the owner a short reason (5+ characters).');
    const shop = rejecting;
    setRejecting(null);
    await run(shop, 'reject', () => setShopStatus(shop.id, 'rejected', reason), 'Registration rejected.');
    setReason('');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Shop verification" />
      <View className="gap-3 px-5 pb-3">
        <View className="flex-row items-center gap-2 rounded-xl px-3" style={{ backgroundColor: Colors.charcoal[800] }}>
          <Search size={16} color={Colors.charcoal[400]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name or city"
            placeholderTextColor={Colors.charcoal[500]}
            className="flex-1 py-3 text-sm"
            style={{ color: Colors.white }}
          />
        </View>
        <Segments
          value={status}
          onChange={setStatus}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Live' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(s) => s.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState icon={Store} title={status === 'pending' ? 'No shops awaiting review' : 'No shops found'} />}
          renderItem={({ item }) => {
            const meta = SHOP_STATUS[item.status];
            const isBusy = (k: string) => busy === `${item.id}:${k}`;
            return (
              <View className="mb-3 overflow-hidden rounded-2xl" style={{ backgroundColor: Colors.charcoal[800] }}>
                <Pressable onPress={() => router.push(`/shop/${item.id}`)} className="flex-row gap-3 p-3">
                  {item.cover_image_url ? (
                    <Image source={{ uri: item.cover_image_url }} className="h-16 w-16 rounded-xl" />
                  ) : (
                    <View className="h-16 w-16 items-center justify-center rounded-xl" style={{ backgroundColor: Colors.charcoal[700] }}>
                      <Store size={20} color={Colors.charcoal[500]} />
                    </View>
                  )}
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="flex-1 text-sm font-semibold text-white" numberOfLines={1}>{item.name}</Text>
                      {item.is_verified && <BadgeCheck size={14} color={Colors.electric[400]} />}
                    </View>
                    <Text className="text-xs" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
                      {item.address}, {item.city}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1">
                      <Phone size={10} color={Colors.charcoal[500]} />
                      <Text className="text-[11px]" style={{ color: Colors.charcoal[400] }}>{item.phone} · submitted {formatDate(item.created_at)}</Text>
                    </View>
                    <View className="mt-1.5"><StatusBadge label={meta.label} color={meta.color} /></View>
                  </View>
                </Pressable>
                {item.rejection_reason && item.status === 'rejected' && (
                  <Text className="px-3 pb-2 text-xs" style={{ color: Colors.error[500] }}>Reason: {item.rejection_reason}</Text>
                )}
                <View className="flex-row flex-wrap gap-2 px-3 pb-3">
                  {item.status !== 'approved' && (
                    <View className="flex-1"><Button label="Approve" size="sm" loading={isBusy('approve')} onPress={() => approve(item)} fullWidth /></View>
                  )}
                  {item.status === 'pending' && (
                    <View className="flex-1"><Button label="Reject" size="sm" variant="danger" onPress={() => { setReason(''); setRejecting(item); }} fullWidth /></View>
                  )}
                  {item.status === 'approved' && (
                    <>
                      <View className="flex-1">
                        <Button
                          label={item.is_verified ? 'Remove badge' : 'Verify'}
                          size="sm"
                          variant={item.is_verified ? 'outline' : 'secondary'}
                          loading={isBusy('verify')}
                          onPress={() => run(item, 'verify', () => setShopVerified(item.id, !item.is_verified), item.is_verified ? 'Verification removed.' : 'Shop verified.')}
                          fullWidth
                        />
                      </View>
                      <View className="flex-1"><Button label="Suspend" size="sm" variant="danger" loading={isBusy('suspend')} onPress={() => suspend(item)} fullWidth /></View>
                    </>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <ModalSheet visible={Boolean(rejecting)} onClose={() => setRejecting(null)} title={`Reject ${rejecting?.name ?? ''}`}>
        <View className="gap-4">
          <Input
            label="Reason (shown to the owner)"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
            placeholder="e.g. Address could not be verified. Please add your postcode."
          />
          <Button label="Reject registration" variant="danger" onPress={confirmReject} fullWidth />
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
