import { useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from 'react-native';
import { Camera, ImagePlus } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { choose } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { pickImage, takePhoto, type PickedImage } from '@/lib/storage';
import { toast } from '@/store/useToastStore';

interface ImagePickerFieldProps {
  label?: string;
  /** Existing remote image or the local preview of a picked one. */
  uri?: string | null;
  onPicked: (image: PickedImage) => void | Promise<void>;
  aspect?: [number, number];
  height?: number;
  busy?: boolean;
  placeholder?: string;
}

/** Lets the user choose a photo from the library or camera. */
export async function chooseImage(aspect?: [number, number]): Promise<PickedImage | null> {
  const source =
    Platform.OS === 'web'
      ? 'library'
      : await choose('Add photo', [
          { label: 'Choose from library', value: 'library' },
          { label: 'Take a photo', value: 'camera' },
        ]);
  if (!source) return null;
  return source === 'camera' ? takePhoto({ aspect }) : pickImage({ aspect });
}

export function ImagePickerField({
  label,
  uri,
  onPicked,
  aspect,
  height = 160,
  busy,
  placeholder = 'Tap to add a photo',
}: ImagePickerFieldProps) {
  const [working, setWorking] = useState(false);
  const loading = busy || working;

  const handlePress = async () => {
    try {
      const image = await chooseImage(aspect);
      if (!image) return;
      setWorking(true);
      await onPicked(image);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  return (
    <View className="w-full">
      {label && (
        <Text className="mb-2 text-sm font-medium" style={{ color: Colors.charcoal[200] }}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={handlePress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        className="overflow-hidden rounded-2xl"
        style={{
          height,
          backgroundColor: Colors.charcoal[800],
          borderWidth: uri ? 0 : 1.5,
          borderStyle: 'dashed',
          borderColor: Colors.charcoal[600],
        }}>
        {uri ? (
          <>
            <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
            <View
              className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-full px-2.5 py-1"
              style={{ backgroundColor: 'rgba(15,17,21,0.75)' }}>
              <Camera size={12} color={Colors.white} />
              <Text className="text-[10px] font-semibold text-white">Change</Text>
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center gap-2">
            <ImagePlus size={28} color={Colors.charcoal[400]} />
            <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
              {placeholder}
            </Text>
          </View>
        )}
        {loading && (
          <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: 'rgba(15,17,21,0.6)' }}>
            <ActivityIndicator color={Colors.accent[500]} />
          </View>
        )}
      </Pressable>
    </View>
  );
}
