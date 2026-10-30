import { View, Text, ScrollView } from 'react-native';
import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email');
      return;
    }
    setError('');
    setSent(true);
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
            Enter your email and we'll send you a link to reset your password
          </Text>
        </View>

        {sent ? (
          <View
            className="mt-8 items-center rounded-2xl p-6"
            style={{ backgroundColor: Colors.success[50] }}>
            <Text
              className="text-center text-base font-semibold"
              style={{ color: Colors.success[700] }}>
              Reset link sent!
            </Text>
            <Text
              className="mt-2 text-center text-sm"
              style={{ color: Colors.success[700] }}>
              Check your inbox at {email} for instructions to reset your password.
            </Text>
            <View className="mt-4 w-full">
              <Button
                label="Back to Login"
                variant="secondary"
                fullWidth
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          </View>
        ) : (
          <View className="mt-8 gap-4">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              error={error}
              leftIcon={<Mail size={20} color={Colors.charcoal[500]} />}
            />
            <Button label="Send Reset Link" onPress={handleReset} fullWidth size="lg" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
