import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Calendar, Mail, Info } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { NOTIFICATIONS } from '@/data/mockData';

const ICON_MAP = {
  booking: { icon: Calendar, color: Colors.electric[500] },
  enquiry: { icon: Mail, color: Colors.success[500] },
  review: { icon: Bell, color: Colors.accent[500] },
  system: { icon: Info, color: Colors.charcoal[400] },
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date('2025-03-01T00:00:00Z');
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 7) return `${Math.floor(days / 7)}w ago`;
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
}

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-3 gap-3">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: Colors.charcoal[800] }}>
          <ArrowLeft size={20} color={Colors.white} />
        </Pressable>
        <Text className="text-xl font-bold text-white">Notifications</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        {NOTIFICATIONS.map((n) => {
          const config = ICON_MAP[n.type];
          const Icon = config.icon;
          return (
            <Pressable
              key={n.id}
              className="mb-3 flex-row rounded-2xl p-4"
              style={{
                backgroundColor: n.read ? Colors.charcoal[800] : `${Colors.charcoal[800]}`,
                borderWidth: n.read ? 0 : 1,
                borderColor: n.read ? 'transparent' : `${config.color}40`,
              }}>
              <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${config.color}20` }}>
                <Icon size={18} color={config.color} />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-white">{n.title}</Text>
                  {!n.read && <View className="h-2 w-2 rounded-full" style={{ backgroundColor: Colors.accent[500] }} />}
                </View>
                <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[300] }}>
                  {n.body}
                </Text>
                <Text className="mt-2 text-[10px]" style={{ color: Colors.charcoal[500] }}>
                  {formatTimeAgo(n.created_at)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
