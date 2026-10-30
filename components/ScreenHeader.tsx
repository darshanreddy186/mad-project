import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function ScreenHeader({ title, subtitle, right, showBack = true, onBack }: ScreenHeaderProps) {
  const router = useRouter();
  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View className="flex-row items-center gap-3 px-5 pb-3 pt-4">
      {showBack && (
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: Colors.charcoal[800] }}>
          <ArrowLeft size={20} color={Colors.white} />
        </Pressable>
      )}
      <View className="flex-1">
        <Text className="text-xl font-bold text-white" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text className="mt-0.5 text-xs" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}
