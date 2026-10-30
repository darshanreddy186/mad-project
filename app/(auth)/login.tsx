import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Gauge } from 'lucide-react-native';
import { useState } from 'react';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resendConfirmation } from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import { validateEmail } from '@/lib/validation';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const hasSession = useAuthStore((s) => Boolean(s.session));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);

  if (hasSession && !loading) return <Redirect href="/" />;

  const handleLogin = async () => {
    const newErrors = {
      email: validateEmail(email),
      password: password ? undefined : 'Password is required',
    };
    setErrors(newErrors);
    setUnconfirmed(false);
    if (newErrors.email || newErrors.password) return;

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (err) {
      const message = getErrorMessage(err);
      setUnconfirmed(message.toLowerCase().includes('confirm your email'));
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmation(email);
      toast.success('Confirmation email sent.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View className="items-center pt-12">
          <View
            className="h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: Colors.accent[600] }}>
            <Gauge size={32} color={Colors.white} />
          </View>
          <Text className="mt-4 text-2xl font-bold text-white">Welcome back</Text>
          <Text className="mt-2 text-sm" style={{ color: Colors.charcoal[400] }}>
            Sign in to find the best mod shops near you
          </Text>
        </View>

        <View className="mt-10 gap-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email}
            leftIcon={<Mail size={20} color={Colors.charcoal[500]} />}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            autoComplete="password"
            error={errors.password}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            leftIcon={<Lock size={20} color={Colors.charcoal[500]} />}
            rightIcon={
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? (
                  <EyeOff size={18} color={Colors.charcoal[400]} />
                ) : (
                  <Eye size={18} color={Colors.charcoal[400]} />
                )}
              </Pressable>
            }
          />
        </View>

        <Pressable
          className="self-end mt-3"
          onPress={() => router.push('/(auth)/forgot-password')}>
          <Text className="text-sm font-semibold" style={{ color: Colors.accent[500] }}>
            Forgot password?
          </Text>
        </Pressable>

        {errors.form && (
          <View className="mt-4 rounded-xl p-3" style={{ backgroundColor: `${Colors.error[500]}18` }}>
            <Text className="text-sm" style={{ color: Colors.error[500] }}>
              {errors.form}
            </Text>
            {unconfirmed && (
              <Pressable onPress={handleResend} className="mt-2">
                <Text className="text-sm font-semibold" style={{ color: Colors.accent[500] }}>
                  Resend confirmation email
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <View className="mt-8">
          <Button label="Sign In" onPress={handleLogin} loading={loading} fullWidth size="lg" />
        </View>

        <View className="my-6 flex-row items-center gap-3">
          <View className="h-px flex-1" style={{ backgroundColor: Colors.charcoal[700] }} />
          <Text className="text-xs" style={{ color: Colors.charcoal[500] }}>
            OR
          </Text>
          <View className="h-px flex-1" style={{ backgroundColor: Colors.charcoal[700] }} />
        </View>

        <View className="gap-3">
          <Button label="Continue as Guest" variant="outline" fullWidth size="md"
            onPress={() => router.replace('/(tabs)')} />
        </View>

        <View className="mt-auto flex-row items-center justify-center pt-8">
          <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>
            Don&apos;t have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text className="text-sm font-bold" style={{ color: Colors.accent[500] }}>
              Sign up
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
