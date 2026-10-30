import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  Calendar,
  Heart,
  Star,
  HelpCircle,
  LogOut,
  Wrench,
  ShieldCheck,
  MessageSquare,
  MapPin,
  UserPen,
  LayoutDashboard,
  Lock,
  LogIn,
} from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { APP_NAME, APP_VERSION, SUPPORT_EMAIL } from '@/constants/config';
import { ROLE_META } from '@/constants/status';
import { Avatar } from '@/components/Avatar';
import { MenuRow } from '@/components/Card';
import { Button } from '@/components/Button';
import { becomeShopOwner } from '@/api/profiles';
import { listMyBookings, ACTIVE_BOOKING_STATUSES } from '@/api/bookings';
import { useQuery } from '@/hooks/useQuery';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { sendEmail } from '@/lib/linking';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6 px-5">
      <Text className="mb-3 text-sm font-semibold" style={{ color: Colors.charcoal[400] }}>
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl" style={{ backgroundColor: Colors.charcoal[800] }}>
        {children}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const hasSession = useAuthStore((s) => Boolean(s.session));
  const signOut = useAuthStore((s) => s.signOut);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const favourites = useAppStore((s) => s.favouriteIds);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const locationLabel = useLocationStore((s) => s.label);
  const [upgrading, setUpgrading] = useState(false);

  const { data: bookings } = useQuery(
    () => listMyBookings(profile!.id),
    [profile?.id],
    { enabled: Boolean(profile), refetchOnFocus: true }
  );
  const upcoming = (bookings ?? []).filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status)).length;

  const help = () => sendEmail(SUPPORT_EMAIL, `${APP_NAME} support`).catch((e) => toast.error(getErrorMessage(e)));

  const handleSignOut = async () => {
    if (!(await confirm('Sign out', 'Are you sure you want to sign out?', { confirmText: 'Sign out', destructive: true }))) return;
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleBecomeOwner = async () => {
    const ok = await confirm(
      'List your shop on AutoMod',
      'Switch your account to a shop owner account? You can then register your shop for approval.',
      { confirmText: 'Continue' }
    );
    if (!ok) return;
    setUpgrading(true);
    try {
      await becomeShopOwner();
      await refreshProfile();
      router.push('/owner');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpgrading(false);
    }
  };

  if (!hasSession || !profile) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="items-center px-8 pt-12">
            <View className="h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: Colors.charcoal[800] }}>
              <LogIn size={32} color={Colors.charcoal[400]} />
            </View>
            <Text className="mt-4 text-xl font-bold text-white">You&apos;re browsing as a guest</Text>
            <Text className="mt-2 text-center text-sm" style={{ color: Colors.charcoal[400] }}>
              Sign in to save shops, book appointments, request quotes and leave reviews.
            </Text>
            <View className="mt-6 w-full gap-3">
              <Button label="Sign in" fullWidth size="lg" onPress={() => router.push('/(auth)/login')} />
              <Button label="Create account" variant="outline" fullWidth onPress={() => router.push('/(auth)/signup')} />
            </View>
          </View>
          <Section title="SETTINGS">
            <MenuRow icon={MapPin} label="Location" value={locationLabel ?? 'Not set'} onPress={() => router.push('/location')} />
            <MenuRow icon={HelpCircle} label="Help & Support" onPress={help} last />
          </Section>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const role = ROLE_META[profile.role];

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile header */}
        <View className="items-center pt-6 px-5">
          <Pressable onPress={() => router.push('/profile/edit')} accessibilityLabel="Edit profile">
            <Avatar name={profile.full_name} uri={profile.avatar_url} size={80} />
          </Pressable>
          <Text className="mt-3 text-xl font-bold text-white">{profile.full_name || 'Your profile'}</Text>
          <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[400] }}>
            {profile.email}
          </Text>
          <View className="mt-3 flex-row items-center gap-2">
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${role.color}20` }}>
              <Text className="text-xs font-semibold" style={{ color: role.color }}>
                {role.label}
              </Text>
            </View>
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: Colors.charcoal[800] }}>
              <Text className="text-xs font-medium" style={{ color: Colors.charcoal[300] }}>
                Member since {new Date(profile.created_at).getFullYear()}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="mt-6 px-5">
          <View className="flex-row gap-3">
            {[
              { label: 'Favourites', value: favourites.length, onPress: () => router.push('/favourites') },
              { label: 'Upcoming', value: upcoming, onPress: () => router.push('/bookings') },
              { label: 'Unread', value: unreadCount, onPress: () => router.push('/notifications') },
            ].map((s) => (
              <Pressable
                key={s.label}
                onPress={s.onPress}
                className="flex-1 items-center rounded-2xl p-4"
                style={{ backgroundColor: Colors.charcoal[800] }}>
                <Text className="text-xl font-bold text-white">{s.value}</Text>
                <Text className="mt-1 text-[10px]" style={{ color: Colors.charcoal[400] }}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {(profile.role === 'shop_owner' || profile.role === 'admin') && (
          <Section title={profile.role === 'admin' ? 'ADMINISTRATION' : 'MY BUSINESS'}>
            {profile.role === 'admin' && (
              <MenuRow icon={ShieldCheck} label="Admin dashboard" color={Colors.error[500]} onPress={() => router.push('/admin')} last />
            )}
            {profile.role === 'shop_owner' && (
              <MenuRow icon={LayoutDashboard} label="Shop dashboard" color={Colors.electric[400]} onPress={() => router.push('/owner')} last />
            )}
          </Section>
        )}

        <Section title="ACCOUNT">
          <MenuRow icon={UserPen} label="Edit profile" color={Colors.accent[500]} onPress={() => router.push('/profile/edit')} />
          <MenuRow icon={Bell} label="Notifications" badge={unreadCount} color={Colors.accent[500]} onPress={() => router.push('/notifications')} />
          <MenuRow icon={Calendar} label="My bookings" value={upcoming ? `${upcoming} upcoming` : undefined} color={Colors.electric[500]} onPress={() => router.push('/bookings')} />
          <MenuRow icon={MessageSquare} label="Enquiries & quotes" color={Colors.success[500]} onPress={() => router.push('/enquiries')} />
          <MenuRow icon={Star} label="My reviews" color={Colors.warning[500]} onPress={() => router.push('/my-reviews')} />
          <MenuRow icon={Heart} label="Saved shops" value={`${favourites.length}`} color={Colors.error[500]} onPress={() => router.push('/favourites')} last={profile.role !== 'customer'} />
          {profile.role === 'customer' && (
            <MenuRow
              icon={Wrench}
              label={upgrading ? 'Switching…' : 'List your shop on AutoMod'}
              color={Colors.electric[400]}
              onPress={handleBecomeOwner}
              last
            />
          )}
        </Section>

        <Section title="SETTINGS">
          <MenuRow icon={MapPin} label="Location" value={locationLabel ?? 'Not set'} onPress={() => router.push('/location')} />
          <MenuRow icon={Lock} label="Privacy & Security" onPress={() => router.push('/account')} />
          <MenuRow icon={HelpCircle} label="Help & Support" onPress={help} last />
        </Section>

        {/* Logout */}
        <View className="mt-6 px-5">
          <Pressable
            onPress={handleSignOut}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
            style={{ backgroundColor: `${Colors.error[500]}15` }}>
            <LogOut size={18} color={Colors.error[500]} />
            <Text className="text-sm font-semibold" style={{ color: Colors.error[500] }}>
              Sign Out
            </Text>
          </Pressable>
        </View>

        <Text className="mt-6 text-center text-xs" style={{ color: Colors.charcoal[600] }}>
          {APP_NAME} v{APP_VERSION}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
