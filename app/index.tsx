import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gauge } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { APP_NAME, STORAGE_KEYS } from '@/constants/config';
import { Button } from '@/components/Button';
import { homeRouteForRole, useAuthStore } from '@/store/useAuthStore';

function Splash({ error, onRetry, onSignOut }: { error?: boolean; onRetry?: () => void; onSignOut?: () => void }) {
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: Colors.charcoal[950] }}>
      <Animated.View
        className="items-center"
        style={{
          opacity: anim,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        }}>
        <View
          className="h-20 w-20 items-center justify-center rounded-3xl"
          style={{ backgroundColor: Colors.accent[600] }}>
          <Gauge size={40} color={Colors.white} strokeWidth={2.2} />
        </View>
        <Text className="mt-5 text-3xl font-bold text-white">{APP_NAME}</Text>
        <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[400] }}>
          Find the best car modification shops
        </Text>
      </Animated.View>
      {error ? (
        <View className="mt-10 w-full gap-3">
          <Text className="text-center text-sm" style={{ color: Colors.charcoal[300] }}>
            We couldn&apos;t load your account. Check your connection and try again.
          </Text>
          <Button label="Try again" onPress={onRetry} fullWidth />
          <Button label="Sign out" variant="ghost" onPress={onSignOut} fullWidth />
        </View>
      ) : (
        <ActivityIndicator className="mt-10" color={Colors.accent[500]} />
      )}
    </View>
  );
}

/** Entry point: decides between onboarding, auth and the role-based home. */
export default function Index() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [profileFailed, setProfileFailed] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.onboardingComplete)
      .then((v) => setOnboardingSeen(v === '1'))
      .catch(() => setOnboardingSeen(true));
  }, []);

  useEffect(() => {
    if (!initialized || !session || profile) return;
    let active = true;
    refreshProfile().then((p) => active && setProfileFailed(!p));
    return () => {
      active = false;
    };
  }, [initialized, session, profile, refreshProfile]);

  if (!initialized || onboardingSeen === null) return <Splash />;
  if (!onboardingSeen) return <Redirect href="/onboarding" />;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile) {
    return (
      <Splash
        error={profileFailed}
        onRetry={() => {
          setProfileFailed(false);
          refreshProfile().then((p) => setProfileFailed(!p));
        }}
        onSignOut={signOut}
      />
    );
  }
  if (profile.is_suspended) return <Redirect href="/suspended" />;
  return <Redirect href={homeRouteForRole(profile.role)} />;
}
