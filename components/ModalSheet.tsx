import { View, Text, Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function ModalSheet({ visible, onClose, title, children }: ModalSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose}>
          <Pressable
            className="rounded-t-3xl px-6 pt-6 pb-10"
            style={{ backgroundColor: Colors.charcoal[900], maxHeight: '90%' }}
            onPress={(e) => e.stopPropagation()}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="flex-1 text-lg font-bold text-white" numberOfLines={1}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: Colors.charcoal[800] }}>
                <X size={18} color={Colors.charcoal[200]} />
              </Pressable>
            </View>
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
