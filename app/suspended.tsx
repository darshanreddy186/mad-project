import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ban } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { APP_NAME, SUPPORT_EMAIL } from '@/constants/config';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { sendEmail } from '@/lib/linking';

export default function SuspendedScreen() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <SafeAreaView className="flex-1 justify-center px-8" style={{ backgroundColor: Colors.charcoal[950] }}>
      <View className="items-center">
        <View className="mb-5 h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: `${Colors.error[500]}20` }}>
          <Ban size={36} color={Colors.error[500]} />
        </View>
        <Text className="text-2xl font-bold text-white">Account suspended</Text>
        <Text className="mt-3 text-center text-sm leading-5" style={{ color: Colors.charcoal[300] }}>
          Your {APP_NAME} account has been suspended by an administrator. If you think this is a
          mistake, please contact support.
        </Text>
      </View>
      <View className="mt-8 gap-3">
        <Button label="Contact support" fullWidth onPress={() => sendEmail(SUPPORT_EMAIL, 'Account suspended').catch(() => {})} />
        <Button
          label="Sign out"
          variant="ghost"
          fullWidth
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
        />
      </View>
    </SafeAreaView>
  );
}
