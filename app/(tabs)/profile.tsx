import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Settings,
  Bell,
  Calendar,
  Heart,
  Star,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Wrench,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { BOOKINGS, NOTIFICATIONS } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';

export default function ProfileScreen() {
  const router = useRouter();
  const favourites = useAppStore((s) => s.favourites);

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;
  const upcomingBookings = BOOKINGS.filter((b) => b.status === 'confirmed' || b.status === 'pending').length;

  const menuItems = [
    { icon: Bell, label: 'Notifications', value: unreadCount > 0 ? `${unreadCount} new` : undefined, route: '/notifications', color: Colors.accent[500] },
    { icon: Calendar, label: 'My Bookings', value: `${upcomingBookings} upcoming`, route: '/bookings', color: Colors.electric[500] },
    { icon: Heart, label: 'Favourites', value: `${favourites.length}`, route: '/favourites', color: Colors.error[500] },
    { icon: Star, label: 'My Reviews', route: '/reviews', color: Colors.warning[500] },
    { icon: CreditCard, label: 'Payment Methods', route: '/payments', color: Colors.success[500] },
    { icon: Wrench, label: 'Become a Shop Owner', route: '/shop-owner/register', color: Colors.electric[400] },
  ];

  const settingsItems = [
    { icon: Settings, label: 'Settings', route: '/settings', color: Colors.charcoal[300] },
    { icon: ShieldCheck, label: 'Privacy & Security', route: '/privacy', color: Colors.charcoal[300] },
    { icon: HelpCircle, label: 'Help & Support', route: '/help', color: Colors.charcoal[300] },
  ];

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
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: Colors.electric[700] }}>
            <Text className="text-2xl font-bold text-white">JS</Text>
          </View>
          <Text className="mt-3 text-xl font-bold text-white">John Smith</Text>
          <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[400] }}>
            john.smith@example.com
          </Text>
          <View className="mt-3 flex-row items-center gap-2">
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${Colors.accent[500]}20` }}>
              <Text className="text-xs font-semibold" style={{ color: Colors.accent[500] }}>
                Customer
              </Text>
            </View>
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: Colors.charcoal[800] }}>
              <Text className="text-xs font-medium" style={{ color: Colors.charcoal[300] }}>
                Member since 2025
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="mt-6 px-5">
          <View className="flex-row gap-3">
            <View className="flex-1 items-center rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
              <Text className="text-xl font-bold text-white">{favourites.length}</Text>
              <Text className="mt-1 text-[10px]" style={{ color: Colors.charcoal[400] }}>Favourites</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
              <Text className="text-xl font-bold text-white">{BOOKINGS.length}</Text>
              <Text className="mt-1 text-[10px]" style={{ color: Colors.charcoal[400] }}>Bookings</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
              <Text className="text-xl font-bold text-white">{unreadCount}</Text>
              <Text className="mt-1 text-[10px]" style={{ color: Colors.charcoal[400] }}>Notifications</Text>
            </View>
          </View>
        </View>

        {/* Menu items */}
        <View className="mt-6 px-5">
          <Text className="mb-3 text-sm font-semibold" style={{ color: Colors.charcoal[400] }}>
            ACCOUNT
          </Text>
          <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: Colors.charcoal[800] }}>
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route as any)}
                  className="flex-row items-center px-4 py-3.5"
                  style={{ borderBottomWidth: i < menuItems.length - 1 ? 1 : 0, borderBottomColor: Colors.charcoal[700] }}>
                  <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}20` }}>
                    <Icon size={18} color={item.color} />
                  </View>
                  <Text className="ml-3 flex-1 text-sm font-medium text-white">{item.label}</Text>
                  {item.value && (
                    <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>{item.value}</Text>
                  )}
                  <ChevronRight size={18} color={Colors.charcoal[600]} style={{ marginLeft: 8 }} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-sm font-semibold" style={{ color: Colors.charcoal[400] }}>
            SETTINGS
          </Text>
          <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: Colors.charcoal[800] }}>
            {settingsItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route as any)}
                  className="flex-row items-center px-4 py-3.5"
                  style={{ borderBottomWidth: i < settingsItems.length - 1 ? 1 : 0, borderBottomColor: Colors.charcoal[700] }}>
                  <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: Colors.charcoal[700] }}>
                    <Icon size={18} color={item.color} />
                  </View>
                  <Text className="ml-3 flex-1 text-sm font-medium text-white">{item.label}</Text>
                  <ChevronRight size={18} color={Colors.charcoal[600]} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Logout */}
        <View className="mt-6 px-5">
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
            style={{ backgroundColor: `${Colors.error[500]}15` }}>
            <LogOut size={18} color={Colors.error[500]} />
            <Text className="text-sm font-semibold" style={{ color: Colors.error[500] }}>
              Sign Out
            </Text>
          </Pressable>
        </View>

        <Text className="mt-6 text-center text-xs" style={{ color: Colors.charcoal[600] }}>
          AutoMod v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
