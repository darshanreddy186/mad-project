import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Mail, Lock, User, Phone, Eye, EyeOff, Wrench, Car, MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resendConfirmation } from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import {
  isValid,
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
} from '@/lib/validation';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';

type SignupRole = 'customer' | 'shop_owner';

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const hasSession = useAuthStore((s) => Boolean(s.session));
  const [role, setRole] = useState<SignupRole>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  if (hasSession && !loading) return <Redirect href="/" />;

  const handleSignup = async () => {
    const newErrors = {
      fullName: validateRequired(fullName, 'Full name', 2),
      email: validateEmail(email),
      phone: validatePhone(phone, role === 'shop_owner'),
      password: validatePassword(password),
      confirmPassword: confirmPassword !== password ? 'Passwords do not match' : undefined,
    };
    setErrors(newErrors);
    if (!isValid(newErrors)) return;

    setLoading(true);
    try {
      const { needsConfirmation } = await signUp({ email, password, fullName, phone, role });
      if (needsConfirmation) {
        setAwaitingConfirmation(true);
      } else {
        toast.success('Account created. Welcome to AutoMod!');
        router.replace('/');
      }
    } catch (err) {
      setErrors({ form: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  if (awaitingConfirmation) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: Colors.charcoal[950] }}>
        <View className="items-center">
          <View
            className="mb-5 h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${Colors.success[500]}20` }}>
            <MailCheck size={36} color={Colors.success[500]} />
          </View>
          <Text className="text-2xl font-bold text-white">Check your inbox</Text>
          <Text className="mt-3 text-center text-sm leading-5" style={{ color: Colors.charcoal[300] }}>
            We sent a confirmation link to <Text className="font-semibold text-white">{email}</Text>.
            Open it on this device to activate your account, then sign in.
          </Text>
        </View>
        <View className="mt-8 gap-3">
          <Button label="Go to sign in" fullWidth size="lg" onPress={() => router.replace('/(auth)/login')} />
          <Button
            label="Resend email"
            variant="ghost"
            fullWidth
            onPress={() =>
              resendConfirmation(email)
                .then(() => toast.success('Confirmation email sent.'))
                .catch((err) => toast.error(getErrorMessage(err)))
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  const roleOption = (value: SignupRole, label: string, Icon: typeof Car) => {
    const selected = role === value;
    return (
      <Pressable
        onPress={() => setRole(value)}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        className="flex-1 flex-row items-center gap-2 rounded-xl border p-3.5"
        style={{
          borderColor: selected ? Colors.accent[500] : Colors.charcoal[700],
          backgroundColor: selected ? `${Colors.accent[500]}15` : 'transparent',
        }}>
        <Icon size={18} color={selected ? Colors.accent[500] : Colors.charcoal[400]} />
        <Text
          className="text-sm font-semibold"
          style={{ color: selected ? Colors.accent[500] : Colors.charcoal[400] }}>
          {label}
        </Text>
      </Pressable>
    );
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
        <View className="pt-10">
          <Text className="text-2xl font-bold text-white">Create account</Text>
          <Text className="mt-2 text-sm" style={{ color: Colors.charcoal[400] }}>
            Join AutoMod to discover and book the best car mod shops
          </Text>
        </View>

        <View className="mt-6">
          <Text className="mb-2.5 text-sm font-medium" style={{ color: Colors.charcoal[200] }}>
            I am a...
          </Text>
          <View className="flex-row gap-3">
            {roleOption('customer', 'Customer', Car)}
            {roleOption('shop_owner', 'Shop Owner', Wrench)}
          </View>
          {role === 'shop_owner' && (
            <Text className="mt-2 text-xs" style={{ color: Colors.charcoal[400] }}>
              After signing up you can register your shop. Listings go live once approved by our team.
            </Text>
          )}
        </View>

        <View className="mt-6 gap-4">
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Smith"
            autoCapitalize="words"
            autoComplete="name"
            error={errors.fullName}
            leftIcon={<User size={20} color={Colors.charcoal[500]} />}
          />
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
            label={role === 'shop_owner' ? 'Phone' : 'Phone (optional)'}
            value={phone}
            onChangeText={setPhone}
            placeholder="+44 7000 000000"
            keyboardType="phone-pad"
            autoComplete="tel"
            error={errors.phone}
            leftIcon={<Phone size={20} color={Colors.charcoal[500]} />}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters, letters and numbers"
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            error={errors.password}
            leftIcon={<Lock size={20} color={Colors.charcoal[500]} />}
            rightIcon={
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={18} color={Colors.charcoal[400]} />
                ) : (
                  <Eye size={18} color={Colors.charcoal[400]} />
                )}
              </Pressable>
            }
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            error={errors.confirmPassword}
            leftIcon={<Lock size={20} color={Colors.charcoal[500]} />}
          />
        </View>

        {errors.form && (
          <View className="mt-4 rounded-xl p-3" style={{ backgroundColor: `${Colors.error[500]}18` }}>
            <Text className="text-sm" style={{ color: Colors.error[500] }}>
              {errors.form}
            </Text>
          </View>
        )}

        <View className="mt-6">
          <Button label="Create Account" onPress={handleSignup} loading={loading} fullWidth size="lg" />
        </View>

        <View className="mt-auto flex-row items-center justify-center pt-8">
          <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-sm font-bold" style={{ color: Colors.accent[500] }}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
