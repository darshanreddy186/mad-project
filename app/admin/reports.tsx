import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flag } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { REPORT_STATUS } from '@/constants/status';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Segments } from '@/components/Chip';
import { Button } from '@/components/Button';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { listReports, resolveReport } from '@/api/admin';
import { setReviewStatus } from '@/api/reviews';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { getErrorMessage } from '@/lib/errors';
import { timeAgo } from '@/lib/format';
import type { Report, ReportStatus } from '@/types';

export default function AdminReportsScreen() {
  const router = useRouter();
  const adminId = useAuthStore((s) => s.profile?.id);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('open');

  const { data, loading, error, refresh, refreshing, refetch } = useQuery(() => listReports(filter), [filter], {
    refetchOnFocus: true,
  });

  const resolve = async (report: Report, status: 'resolved' | 'dismissed', hideReview = false) => {
    if (!adminId) return;
    try {
      if (hideReview && report.review_id) await setReviewStatus(report.review_id, 'hidden', `Reported: ${report.reason}`);
      await resolveReport(report.id, adminId, status, hideReview ? 'Review hidden' : undefined);
      toast.success(status === 'resolved' ? 'Report resolved.' : 'Report dismissed.');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Reports" />
      <View className="px-5 pb-3">
        <Segments
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'dismissed', label: 'Dismissed' },
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
          keyExtractor={(r) => r.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState icon={Flag} title={filter === 'open' ? 'No open reports' : 'No reports'} />}
          renderItem={({ item }) => {
            const shopId = item.shop_id ?? item.review?.shop_id ?? null;
            return (
              <View className="mb-3 rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-white">{item.reason}</Text>
                  <Text className="text-[11px]" style={{ color: Colors.charcoal[500] }}>{timeAgo(item.created_at)}</Text>
                </View>
                <Text className="mt-1 text-xs" style={{ color: Colors.charcoal[400] }}>
                  {item.review_id ? 'Reported review' : `Reported shop: ${item.shop?.name ?? ''}`}
                </Text>
                {item.details && <Text className="mt-2 text-sm" style={{ color: Colors.charcoal[200] }}>{item.details}</Text>}
                {item.review && (
                  <View className="mt-3 rounded-xl p-3" style={{ backgroundColor: Colors.charcoal[900] }}>
                    <Text className="text-xs" style={{ color: Colors.accent[500] }}>{'★'.repeat(item.review.rating)}</Text>
                    <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[200] }}>&ldquo;{item.review.comment || '(no comment)'}&rdquo;</Text>
                    <Text className="mt-1 text-[10px]" style={{ color: Colors.charcoal[500] }}>Review is {item.review.status}</Text>
                  </View>
                )}
                {item.resolution_note && (
                  <Text className="mt-2 text-xs" style={{ color: Colors.charcoal[400] }}>Resolution: {item.resolution_note}</Text>
                )}
                <View className="mt-3 flex-row flex-wrap items-center gap-2">
                  <StatusBadge label={REPORT_STATUS[item.status].label} color={REPORT_STATUS[item.status].color} />
                  <View className="flex-1" />
                  {shopId && <Button label="View" size="sm" variant="ghost" onPress={() => router.push(`/shop/${shopId}`)} />}
                  {item.status === 'open' && (
                    <>
                      {item.review && item.review.status === 'published' && (
                        <Button label="Hide review" size="sm" variant="danger" onPress={() => resolve(item, 'resolved', true)} />
                      )}
                      <Button label="Resolve" size="sm" variant="secondary" onPress={() => resolve(item, 'resolved')} />
                      <Button label="Dismiss" size="sm" variant="outline" onPress={() => resolve(item, 'dismissed')} />
                    </>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
