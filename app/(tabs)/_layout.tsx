import { Tabs } from 'expo-router';
import { Home, Compass, Map, Heart, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const unread = useNotificationStore((s) => s.unreadCount);
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent[500],
        tabBarInactiveTintColor: Colors.charcoal[400],
        tabBarStyle: {
          backgroundColor: Colors.charcoal[900],
          borderTopColor: Colors.charcoal[800],
          borderTopWidth: 1,
          height: 52 + bottom,
          paddingBottom: bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        sceneStyle: { backgroundColor: Colors.charcoal[950] },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Browse',
          tabBarIcon: ({ size, color }) => (
            <Compass size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ size, color }) => (
            <Map size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: 'Saved',
          tabBarIcon: ({ size, color }) => (
            <Heart size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.accent[600], fontSize: 10 },
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
