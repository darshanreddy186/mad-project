import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  noPadding?: boolean;
}

export function ScreenContainer({
  children,
  edges = ['top', 'bottom'],
  noPadding,
}: ScreenContainerProps) {
  return (
    <SafeAreaView
      edges={edges}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <View
        className="flex-1"
        style={{ paddingHorizontal: noPadding ? 0 : 16 }}>
        {children}
      </View>
    </SafeAreaView>
  );
}
