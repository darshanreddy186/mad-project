import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = () => {
    const newErrors: { email?: string; password?: string } = {};
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
        <View className="items-center pt-12">
          <Image
            source={{ uri: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg' }}
            className="h-16 w-16 rounded-2xl"
            resizeMode="cover"
          />
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
            error={errors.email}
            leftIcon={<Mail size={20} color={Colors.charcoal[500]} />}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
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

        <Pressable
          className="self-end mt-2"
          onPress={() => router.push('/(auth)/forgot-password')}>
          <Text className="text-sm font-semibold" style={{ color: Colors.accent[500] }}>
            Forgot password?
          </Text>
        </Pressable>

        <View className="mt-8">
          <Button label="Sign In" onPress={handleLogin} fullWidth size="lg" />
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
            Don't have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text className="text-sm font-bold" style={{ color: Colors.accent[500] }}>
              Sign up
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
