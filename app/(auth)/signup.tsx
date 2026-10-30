import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, Phone, Eye, EyeOff, Wrench, Car } from 'lucide-react-native';
import { useState } from 'react';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { UserRole } from '@/types';

export default function SignupScreen() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignup = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName) newErrors.fullName = 'Full name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!email.includes('@')) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      router.replace('/(tabs)');
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
            <Pressable
              onPress={() => setRole('customer')}
              className="flex-1 flex-row items-center gap-2 rounded-xl border p-3.5"
              style={{
                borderColor: role === 'customer' ? Colors.accent[500] : Colors.charcoal[700],
                backgroundColor: role === 'customer' ? `${Colors.accent[500]}15` : 'transparent',
              }}>
              <Car size={18} color={role === 'customer' ? Colors.accent[500] : Colors.charcoal[400]} />
              <Text
                className="text-sm font-semibold"
                style={{ color: role === 'customer' ? Colors.accent[500] : Colors.charcoal[400] }}>
                Customer
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRole('shop_owner')}
              className="flex-1 flex-row items-center gap-2 rounded-xl border p-3.5"
              style={{
                borderColor: role === 'shop_owner' ? Colors.accent[500] : Colors.charcoal[700],
                backgroundColor: role === 'shop_owner' ? `${Colors.accent[500]}15` : 'transparent',
              }}>
              <Wrench size={18} color={role === 'shop_owner' ? Colors.accent[500] : Colors.charcoal[400]} />
              <Text
                className="text-sm font-semibold"
                style={{ color: role === 'shop_owner' ? Colors.accent[500] : Colors.charcoal[400] }}>
                Shop Owner
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-6 gap-4">
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Smith"
            autoCapitalize="words"
            error={errors.fullName}
            leftIcon={<User size={20} color={Colors.charcoal[500]} />}
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={errors.email}
            leftIcon={<Mail size={20} color={Colors.charcoal[500]} />}
          />
          <Input
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="+44 700 000 0000"
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={Colors.charcoal[500]} />}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min 6 characters"
            secureTextEntry={!showPassword}
            error={errors.password}
            leftIcon={<Lock size={20} color={Colors.charcoal[500]} />}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            className="flex-row items-center gap-1.5 self-end">
            {showPassword ? (
              <EyeOff size={16} color={Colors.charcoal[400]} />
            ) : (
              <Eye size={16} color={Colors.charcoal[400]} />
            )}
            <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
              {showPassword ? 'Hide' : 'Show'} password
            </Text>
          </Pressable>
        </View>

        <View className="mt-6">
          <Button label="Create Account" onPress={handleSignup} fullWidth size="lg" />
        </View>

        <View className="mt-auto flex-row items-center justify-center pt-8">
          <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text className="text-sm font-bold" style={{ color: Colors.accent[500] }}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
