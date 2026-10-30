import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EnquiryCard } from '@/components/EnquiryCard';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { SignInPrompt } from '@/components/SignInPrompt';
import { listMyEnquiries } from '@/api/enquiries';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';

export default function MyEnquiriesScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data, loading, error, refresh, refreshing } = useQuery(() => listMyEnquiries(userId!), [userId], {
    enabled: Boolean(userId),
    refetchOnFocus: true,
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Enquiries & quotes" />
      {!userId ? (
        <SignInPrompt message="Sign in to see your enquiries and quotes." />
      ) : loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => <EnquiryCard enquiry={item} onPress={() => router.push(`/enquiry/${item.id}`)} />}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              icon={MessageSquare}
              title="No enquiries yet"
              message="Message a shop or request a quotation from any shop profile."
              actionLabel="Find shops"
              onAction={() => router.push('/shops')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
