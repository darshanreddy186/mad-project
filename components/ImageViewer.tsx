import { Image, Modal, Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface ImageViewerProps {
  uri: string | null;
  caption?: string | null;
  onClose: () => void;
}

/** Full-screen photo viewer for gallery and portfolio images. */
export function ImageViewer({ uri, caption, onClose }: ImageViewerProps) {
  return (
    <Modal visible={Boolean(uri)} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}>
        {uri && <Image source={{ uri }} style={{ width: '100%', height: '75%' }} resizeMode="contain" />}
        {!!caption && (
          <Text className="mt-4 px-6 text-center text-sm" style={{ color: Colors.charcoal[200] }}>
            {caption}
          </Text>
        )}
        <Pressable
          onPress={onClose}
          accessibilityLabel="Close"
          className="absolute right-5 top-14 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <X size={20} color={Colors.white} />
        </Pressable>
      </View>
    </Modal>
  );
}
