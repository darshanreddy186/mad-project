import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useToastStore } from '@/store/useToastStore';

const ICONS = {
  success: { Icon: CheckCircle2, color: Colors.success[500] },
  error: { Icon: XCircle, color: Colors.error[500] },
  info: { Icon: Info, color: Colors.electric[400] },
};

/** Global toast host; render once at the root. */
export function Toast() {
  const { message, type, key, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => hide());
    }, 3200);
    return () => clearTimeout(timer);
  }, [key, message, anim, hide]);

  if (!message) return null;
  const { Icon, color } = ICONS[type];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }}>
      <Pressable
        onPress={hide}
        accessibilityRole="alert"
        className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5"
        style={{
          backgroundColor: Colors.charcoal[800],
          borderWidth: 1,
          borderColor: `${color}60`,
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}>
        <Icon size={20} color={color} />
        <Text className="flex-1 text-sm font-medium text-white">{message}</Text>
      </Pressable>
    </Animated.View>
  );
}
