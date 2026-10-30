import { Image, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { initials } from '@/lib/format';

interface AvatarProps {
  name: string | null | undefined;
  uri?: string | null;
  size?: number;
}

export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.electric[700] }}>
      <Text className="font-bold text-white" style={{ fontSize: size * 0.36 }}>
        {initials(name)}
      </Text>
    </View>
  );
}
