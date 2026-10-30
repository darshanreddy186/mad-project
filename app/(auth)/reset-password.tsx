import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { LoadingView } from '@/components/StateViews';
import { updatePassword } from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import { validatePassword } from '@/lib/validation';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';

/** Reached from the recovery deep link or after verifying the recovery code. */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const initialized = useAuthStore((s) => s.initialized);
  const hasSession = useAuthStore((s) => Boolean(s.session));
  const setPasswordRecovery = useAuthStore((s) => s.setPasswordRecovery);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  if (!initialized) return <LoadingView />;

  const handleSave = async () => {
    const next = {
      password: validatePassword(password),
      confirm: confirmPassword !== password ? 'Passwords do not match' : undefined,
    };
    setErrors(next);
    if (next.password || next.confirm) return;
    setLoading(true);
    try {
      await updatePassword(password);
      setPasswordRecovery(false);
      toast.success('Password updated.');
      router.replace('/');
    } catch (err) {
      setErrors({ form: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text className="mt-8 text-2xl font-bold text-white">Choose a new password</Text>
        {!hasSession ? (
          <View className="mt-6 gap-4">
            <Text className="text-sm" style={{ color: Colors.charcoal[300] }}>
              This reset link has expired or was already used. Request a new one to continue.
            </Text>
            <Button label="Request new link" fullWidth onPress={() => router.replace('/(auth)/forgot-password')} />
          </View>
        ) : (
          <View className="mt-6 gap-4">
            <Input
              label="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="At least 8 characters, letters and numbers"
              error={errors.password}
              leftIcon={<Lock size={20} color={Colors.charcoal[500]} />}
            />
            <Input
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              error={errors.confirm}
              leftIcon={<Lock size={20} color={Colors.charcoal[500]} />}
            />
            {errors.form && (
              <Text className="text-sm" style={{ color: Colors.error[500] }}>
                {errors.form}
              </Text>
            )}
            <Button label="Update password" loading={loading} onPress={handleSave} fullWidth size="lg" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
