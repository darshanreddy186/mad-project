import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, ShieldAlert } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SignInPrompt } from '@/components/SignInPrompt';
import { deleteAccount, updatePassword } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { validatePassword } from '@/lib/validation';

export default function AccountSecurityScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!profile) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <ScreenHeader title="Privacy & Security" />
        <SignInPrompt message="Sign in to manage your account." />
      </SafeAreaView>
    );
  }

  const changePassword = async () => {
    const next = {
      password: validatePassword(password),
      confirm: confirmPassword !== password ? 'Passwords do not match' : undefined,
    };
    setErrors(next);
    if (next.password || next.confirm) return;
    setSaving(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirmPassword('');
      toast.success('Password changed.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = async () => {
    const first = await confirm(
      'Delete account',
      'This permanently deletes your profile, bookings, enquiries, reviews and favourites' +
        (profile.role === 'shop_owner' ? ', and your shop listing' : '') +
        '. This cannot be undone.',
      { confirmText: 'Continue', destructive: true }
    );
    if (!first) return;
    const second = await confirm('Are you absolutely sure?', 'Your account will be deleted immediately.', {
      confirmText: 'Delete my account',
      destructive: true,
    });
    if (!second) return;
    setDeleting(true);
    try {
      await deleteAccount();
      await signOut();
      toast.success('Your account has been deleted.');
      router.replace('/(auth)/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Privacy & Security" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Card title="Change password" icon={Lock}>
          <View className="gap-3">
            <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" error={errors.password} />
            <Input label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" error={errors.confirm} />
            <Button label="Update password" onPress={changePassword} loading={saving} fullWidth />
          </View>
        </Card>

        <Card title="Your data" icon={ShieldAlert}>
          <Text className="text-sm leading-5" style={{ color: Colors.charcoal[300] }}>
            Your profile is private. Shops only see the contact details you include in bookings and
            enquiries. Reviews show your name publicly.
          </Text>
        </Card>

        <Card title="Danger zone">
          <Text className="mb-3 text-sm" style={{ color: Colors.charcoal[300] }}>
            Permanently delete your AutoMod account and all associated data.
          </Text>
          <Button label="Delete account" variant="danger" onPress={removeAccount} loading={deleting} fullWidth />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
