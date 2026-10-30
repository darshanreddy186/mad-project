import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePlus, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ImagePickerField, chooseImage } from '@/components/ImagePickerField';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { addImage, deleteImage, listImages } from '@/api/catalog';
import { updateShopBranding } from '@/api/shops';
import { useQuery } from '@/hooks/useQuery';
import { useOwnerStore } from '@/store/useOwnerStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import type { ShopImage } from '@/types';

const MAX_IMAGES = 24;

export default function ShopGalleryScreen() {
  const { shop, setShop } = useOwnerStore();
  const [uploading, setUploading] = useState(false);

  const { data, loading, error, refresh, refetch, refreshing } = useQuery(() => listImages(shop!.id), [shop?.id], {
    enabled: Boolean(shop),
  });

  if (!shop) return <EmptyState title="Register your shop first" />;
  const images = data ?? [];

  const add = async () => {
    if (images.length >= MAX_IMAGES) return toast.info(`You can upload up to ${MAX_IMAGES} photos.`);
    try {
      const image = await chooseImage([4, 3]);
      if (!image) return;
      setUploading(true);
      await addImage(shop.id, image, undefined, images.length);
      toast.success('Photo uploaded.');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (img: ShopImage) => {
    if (!(await confirm('Delete photo', 'Remove this photo from your gallery?', { confirmText: 'Delete', destructive: true }))) return;
    try {
      await deleteImage(img);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const branding = (kind: 'logo' | 'cover') => async (image: Parameters<typeof updateShopBranding>[2]) => {
    setShop(await updateShopBranding(shop, kind, image));
    toast.success(kind === 'logo' ? 'Logo updated.' : 'Cover photo updated.');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Photos & branding" subtitle={shop.name} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.accent[500]} />}>
        <Text className="mb-3 text-sm font-semibold" style={{ color: Colors.charcoal[400] }}>BRANDING</Text>
        <ImagePickerField label="Cover photo (shown on listings)" uri={shop.cover_image_url} aspect={[16, 9]} height={170} onPicked={branding('cover')} />
        <View className="mt-4 w-32">
          <ImagePickerField label="Logo" uri={shop.logo_url} aspect={[1, 1]} height={128} onPicked={branding('logo')} placeholder="Add logo" />
        </View>

        <View className="mb-3 mt-8 flex-row items-center justify-between">
          <Text className="text-sm font-semibold" style={{ color: Colors.charcoal[400] }}>
            GALLERY ({images.length}/{MAX_IMAGES})
          </Text>
        </View>
        {loading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView message={error} onRetry={refresh} />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={add}
              disabled={uploading}
              accessibilityLabel="Add photo"
              className="h-28 w-[31.5%] items-center justify-center rounded-xl"
              style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.charcoal[600], backgroundColor: Colors.charcoal[800] }}>
              {uploading ? <ActivityIndicator color={Colors.accent[500]} /> : <ImagePlus size={24} color={Colors.charcoal[400]} />}
              <Text className="mt-1 text-[10px]" style={{ color: Colors.charcoal[400] }}>{uploading ? 'Uploading…' : 'Add photo'}</Text>
            </Pressable>
            {images.map((img) => (
              <View key={img.id} className="h-28 w-[31.5%] overflow-hidden rounded-xl">
                <Image source={{ uri: img.image_url }} className="h-full w-full" resizeMode="cover" />
                <Pressable
                  onPress={() => remove(img)}
                  accessibilityLabel="Delete photo"
                  className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(15,17,21,0.75)' }}>
                  <Trash2 size={13} color={Colors.error[500]} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <Text className="mt-4 text-xs" style={{ color: Colors.charcoal[500] }}>
          Show your workshop, team and finished cars. JPG, PNG or WebP up to 10 MB.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
