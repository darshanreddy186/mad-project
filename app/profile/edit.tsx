import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Mail, Phone, User } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/Avatar';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { SignInPrompt } from '@/components/SignInPrompt';
import { chooseImage } from '@/components/ImagePickerField';
import { updateProfile, uploadAvatar } from '@/api/profiles';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { getErrorMessage } from '@/lib/errors';
import { isValid, validatePhone, validateRequired } from '@/lib/validation';

export default function EditProfileScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!profile) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <ScreenHeader title="Edit profile" />
        <SignInPrompt message="Sign in to manage your profile." />
      </SafeAreaView>
    );
  }

  const changeAvatar = async () => {
    try {
      const image = await chooseImage([1, 1]);
      if (!image) return;
      setUploading(true);
      setProfile(await uploadAvatar(profile, image));
      toast.success('Profile photo updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const nextErrors = {
      fullName: validateRequired(fullName, 'Full name', 2),
      phone: validatePhone(phone, false),
    };
    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;
    setSaving(true);
    try {
      setProfile(await updateProfile(profile.id, { full_name: fullName.trim(), phone: phone.trim() || null }));
      toast.success('Profile saved.');
      router.back();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Edit profile" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <View className="items-center">
            <Pressable onPress={changeAvatar} disabled={uploading} accessibilityLabel="Change profile photo">
              <Avatar name={fullName || profile.full_name} uri={profile.avatar_url} size={96} />
              <View
                className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: Colors.accent[600], borderWidth: 2, borderColor: Colors.charcoal[950] }}>
                {uploading ? <ActivityIndicator size="small" color={Colors.white} /> : <Camera size={14} color={Colors.white} />}
              </View>
            </Pressable>
            <Text className="mt-2 text-xs" style={{ color: Colors.charcoal[400] }}>Tap to change photo</Text>
          </View>

          <View className="mt-6 gap-4">
            <Input label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" error={errors.fullName} leftIcon={<User size={18} color={Colors.charcoal[500]} />} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} leftIcon={<Phone size={18} color={Colors.charcoal[500]} />} />
            <Input
              label="Email"
              value={profile.email ?? ''}
              onChangeText={() => {}}
              editable={false}
              hint="Email changes are not supported in-app. Contact support if you need to change it."
              leftIcon={<Mail size={18} color={Colors.charcoal[600]} />}
            />
          </View>

          <View className="mt-8">
            <Button label="Save changes" onPress={save} loading={saving} fullWidth size="lg" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
