import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EnquiryCard } from '@/components/EnquiryCard';
import { Segments } from '@/components/Chip';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { listShopEnquiries } from '@/api/enquiries';
import { useQuery } from '@/hooks/useQuery';
import { useOwnerStore } from '@/store/useOwnerStore';
import type { EnquiryStatus } from '@/types';

export default function OwnerEnquiriesScreen() {
  const router = useRouter();
  const shop = useOwnerStore((s) => s.shop);
  const [tab, setTab] = useState<EnquiryStatus>('open');

  const { data, loading, error, refresh, refreshing } = useQuery(() => listShopEnquiries(shop!.id), [shop?.id], {
    enabled: Boolean(shop),
    refetchOnFocus: true,
  });

  if (!shop) return <EmptyState title="Register your shop first" />;

  const all = data ?? [];
  const count = (s: EnquiryStatus) => all.filter((e) => e.status === s).length;

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Enquiries & quotes" subtitle={shop.name} />
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : (
        <>
          <View className="px-5 pb-3">
            <Segments
              value={tab}
              onChange={setTab}
              options={[
                { value: 'open', label: 'Awaiting reply', count: count('open') },
                { value: 'responded', label: 'Replied', count: count('responded') },
                { value: 'closed', label: 'Closed' },
              ]}
            />
          </View>
          <FlatList
            data={all.filter((e) => e.status === tab)}
            keyExtractor={(e) => e.id}
            refreshing={refreshing}
            onRefresh={refresh}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
            renderItem={({ item }) => (
              <EnquiryCard enquiry={item} perspective="owner" onPress={() => router.push(`/enquiry/${item.id}`)} />
            )}
            ListEmptyComponent={
              <EmptyState icon={MessageSquare} title="Nothing here" message={tab === 'open' ? 'New customer enquiries and quote requests appear here.' : undefined} />
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}
