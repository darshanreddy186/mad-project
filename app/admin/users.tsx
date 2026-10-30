import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Users } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ROLE_META } from '@/constants/status';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { Segments } from '@/components/Chip';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { listUsers, setUserRole, setUserSuspended } from '@/api/admin';
import { deleteAccount } from '@/api/auth';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { choose, confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import type { Profile, UserRole } from '@/types';

type RoleFilter = UserRole | 'all';
type Action = 'customer' | 'shop_owner' | 'admin' | 'suspend' | 'unsuspend' | 'delete';

export default function AdminUsersScreen() {
  const me = useAuthStore((s) => s.profile);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const debounced = useDebounce(search);

  const { data, loading, error, refresh, refreshing, refetch } = useQuery(() => listUsers(debounced, role), [debounced, role]);

  const manage = async (user: Profile) => {
    const isSelf = user.id === me?.id;
    const options: { label: string; value: Action; destructive?: boolean }[] = [
      ...(['customer', 'shop_owner', 'admin'] as const)
        .filter((r) => r !== user.role && !isSelf)
        .map((r) => ({ label: `Make ${ROLE_META[r].label.toLowerCase()}`, value: r })),
      ...(!isSelf
        ? [
            user.is_suspended
              ? { label: 'Reinstate account', value: 'unsuspend' as const }
              : { label: 'Suspend account', value: 'suspend' as const, destructive: true },
            { label: 'Delete account permanently', value: 'delete' as const, destructive: true },
          ]
        : []),
    ];
    if (options.length === 0) return toast.info('You cannot change your own account here.');

    const action = await choose(user.full_name || user.email || 'User', options, user.email ?? undefined);
    if (!action) return;

    try {
      if (action === 'suspend' || action === 'unsuspend') {
        await setUserSuspended(user.id, action === 'suspend');
      } else if (action === 'delete') {
        if (!(await confirm('Delete account', `Permanently delete ${user.email}? This removes all their data.`, { confirmText: 'Delete', destructive: true }))) return;
        await deleteAccount(user.id);
      } else {
        if (action === 'admin' && !(await confirm('Grant admin access', `Give ${user.email} full administrator access?`, { confirmText: 'Grant' }))) return;
        await setUserRole(user.id, action);
      }
      toast.success('User updated.');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Users" />
      <View className="gap-3 px-5 pb-3">
        <View className="flex-row items-center gap-2 rounded-xl px-3" style={{ backgroundColor: Colors.charcoal[800] }}>
          <Search size={16} color={Colors.charcoal[400]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name or email"
            placeholderTextColor={Colors.charcoal[500]}
            autoCapitalize="none"
            className="flex-1 py-3 text-sm"
            style={{ color: Colors.white }}
          />
        </View>
        <Segments
          value={role}
          onChange={setRole}
          options={[
            { value: 'all', label: 'All' },
            { value: 'customer', label: 'Customers' },
            { value: 'shop_owner', label: 'Owners' },
            { value: 'admin', label: 'Admins' },
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
          keyExtractor={(u) => u.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState icon={Users} title="No users found" />}
          renderItem={({ item }) => {
            const meta = ROLE_META[item.role];
            return (
              <Pressable
                onPress={() => manage(item)}
                className="mb-2 flex-row items-center gap-3 rounded-2xl p-3"
                style={{ backgroundColor: Colors.charcoal[800] }}>
                <Avatar name={item.full_name} uri={item.avatar_url} size={42} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                    {item.full_name || '—'} {item.id === me?.id ? '(you)' : ''}
                  </Text>
                  <Text className="text-xs" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
                    {item.email} · joined {formatDate(item.created_at)}
                  </Text>
                  <View className="mt-1.5 flex-row gap-2">
                    <StatusBadge label={meta.label} color={meta.color} />
                    {item.is_suspended && <StatusBadge label="Suspended" color={Colors.error[500]} />}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
