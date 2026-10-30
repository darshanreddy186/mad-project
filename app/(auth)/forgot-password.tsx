import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { sendPasswordReset, verifyRecoveryCode } from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import { validateEmail } from '@/lib/validation';
import { useAuthStore } from '@/store/useAuthStore';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const setPasswordRecovery = useAuthStore((s) => s.setPasswordRecovery);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);
    setError('');
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code from the email');
    setError('');
    setLoading(true);
    try {
      await verifyRecoveryCode(email, code);
      setPasswordRecovery(true);
      router.replace('/(auth)/reset-password');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => router.back()}
          className="mt-4 flex-row items-center gap-2">
          <ArrowLeft size={20} color={Colors.charcoal[200]} />
          <Text className="text-sm font-medium" style={{ color: Colors.charcoal[200] }}>
            Back
          </Text>
        </Pressable>

        <View className="mt-8">
          <Text className="text-2xl font-bold text-white">Reset password</Text>
          <Text className="mt-2 text-sm" style={{ color: Colors.charcoal[400] }}>
            {sent
              ? `We've emailed ${email.trim()} a reset link.`
              : "Enter your email and we'll send you a link to reset your password"}
          </Text>
        </View>

        {sent ? (
          <View className="mt-8 gap-4">
            <View className="rounded-2xl p-4" style={{ backgroundColor: `${Colors.success[500]}15` }}>
              <Text className="text-sm font-semibold" style={{ color: Colors.success[500] }}>
                Check your inbox
              </Text>
              <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[200] }}>
                Open the link on this device to choose a new password. If your email contains a
                6-digit code, you can enter it below instead.
              </Text>
            </View>
            <Input
              label="Reset code"
              value={code}
              onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="123456"
              keyboardType="number-pad"
              error={error}
              leftIcon={<KeyRound size={20} color={Colors.charcoal[500]} />}
            />
            <Button label="Verify code" onPress={handleVerifyCode} loading={loading} fullWidth size="lg" />
            <Button label="Send again" variant="ghost" onPress={handleReset} fullWidth />
            <Button
              label="Back to Login"
              variant="outline"
              fullWidth
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        ) : (
          <View className="mt-8 gap-4">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              error={error}
              leftIcon={<Mail size={20} color={Colors.charcoal[500]} />}
            />
            <Button label="Send Reset Link" onPress={handleReset} loading={loading} fullWidth size="lg" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
