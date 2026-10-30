import { useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, Plus, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ModalSheet } from '@/components/ModalSheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Badge } from '@/components/Badge';
import { ImagePickerField } from '@/components/ImagePickerField';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { createPortfolioItem, deletePortfolioItem, listPortfolio } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useAppStore } from '@/store/useAppStore';
import { useOwnerStore } from '@/store/useOwnerStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { parseYear, validateRequired } from '@/lib/validation';
import type { PickedImage } from '@/lib/storage';
import type { PortfolioItem } from '@/types';

interface Draft {
  title: string;
  description: string;
  category_id: string | null;
  make: string;
  model: string;
  year: string;
  before: PickedImage | null;
  after: PickedImage | null;
}

const EMPTY: Draft = { title: '', description: '', category_id: null, make: '', model: '', year: '', before: null, after: null };

export default function ManagePortfolioScreen() {
  const shop = useOwnerStore((s) => s.shop);
  const categories = useAppStore((s) => s.categories);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refresh, refetch, refreshing } = useQuery(() => listPortfolio(shop!.id), [shop?.id], {
    enabled: Boolean(shop),
  });

  if (!shop) return <EmptyState title="Register your shop first" />;

  const save = async () => {
    if (!draft) return;
    const year = parseYear(draft.year);
    const nextErrors = {
      title: validateRequired(draft.title, 'Title', 2),
      make: validateRequired(draft.make, 'Make'),
      model: validateRequired(draft.model, 'Model'),
      year: Number.isNaN(year) ? 'Enter a valid year' : undefined,
      images: draft.before && draft.after ? undefined : 'Add both a before and an after photo',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || !draft.before || !draft.after) return;

    setSaving(true);
    try {
      await createPortfolioItem(
        shop.id,
        {
          title: draft.title.trim(),
          description: draft.description.trim(),
          category_id: draft.category_id,
          vehicle_make: draft.make.trim(),
          vehicle_model: draft.model.trim(),
          vehicle_year: year,
        },
        draft.before,
        draft.after
      );
      toast.success('Project added to your portfolio.');
      setDraft(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: PortfolioItem) => {
    if (!(await confirm('Delete project', `Delete "${item.title}" and its photos?`, { confirmText: 'Delete', destructive: true }))) return;
    try {
      await deletePortfolioItem(item);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader
        title="Before & after portfolio"
        subtitle={shop.name}
        right={
          <Pressable
            onPress={() => {
              setErrors({});
              setDraft({ ...EMPTY, category_id: categories[0]?.id ?? null });
            }}
            accessibilityLabel="Add project"
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: Colors.accent[600] }}>
            <Plus size={20} color={Colors.white} />
          </Pressable>
        }
      />
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(p) => p.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardList}
              title="Show off your work"
              message="Before-and-after projects are the best way to win customers."
              actionLabel="Add a project"
              onAction={() => setDraft({ ...EMPTY, category_id: categories[0]?.id ?? null })}
            />
          }
          renderItem={({ item }) => {
            const cat = categories.find((c) => c.id === item.category_id);
            return (
              <View className="mb-4 overflow-hidden rounded-2xl" style={{ backgroundColor: Colors.charcoal[800] }}>
                <View className="flex-row">
                  <Image source={{ uri: item.before_image_url }} className="h-32 flex-1" resizeMode="cover" />
                  <Image source={{ uri: item.after_image_url }} className="h-32 flex-1" resizeMode="cover" />
                </View>
                <View className="flex-row items-start justify-between gap-3 p-3">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-white">{item.title}</Text>
                    <Text className="mt-0.5 text-xs" style={{ color: Colors.charcoal[400] }}>
                      {[item.vehicle_year, item.vehicle_make, item.vehicle_model].filter(Boolean).join(' ')}
                    </Text>
                    {cat && <View className="mt-2 flex-row"><Badge label={cat.name} color={cat.color} /></View>}
                  </View>
                  <Pressable onPress={() => remove(item)} hitSlop={8} accessibilityLabel="Delete project">
                    <Trash2 size={16} color={Colors.error[500]} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <ModalSheet visible={Boolean(draft)} onClose={() => setDraft(null)} title="New portfolio project">
        {draft && (
          <ScrollView style={{ maxHeight: 600 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="gap-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <ImagePickerField label="Before" uri={draft.before?.uri} aspect={[4, 3]} height={120} onPicked={(img) => setDraft({ ...draft, before: img })} placeholder="Add before" />
                </View>
                <View className="flex-1">
                  <ImagePickerField label="After" uri={draft.after?.uri} aspect={[4, 3]} height={120} onPicked={(img) => setDraft({ ...draft, after: img })} placeholder="Add after" />
                </View>
              </View>
              {errors.images && <Text className="-mt-2 text-xs" style={{ color: Colors.error[500] }}>{errors.images}</Text>}
              <Input label="Project title" value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} autoCapitalize="sentences" placeholder="e.g. Golf R Stage 2 build" error={errors.title} />
              <View className="flex-row gap-3">
                <View className="flex-1"><Input label="Make" value={draft.make} onChangeText={(v) => setDraft({ ...draft, make: v })} autoCapitalize="words" error={errors.make} /></View>
                <View className="flex-1"><Input label="Model" value={draft.model} onChangeText={(v) => setDraft({ ...draft, model: v })} autoCapitalize="words" error={errors.model} /></View>
              </View>
              <Input label="Year (optional)" value={draft.year} onChangeText={(v) => setDraft({ ...draft, year: v })} keyboardType="number-pad" maxLength={4} error={errors.year} />
              <View>
                <Text className="mb-2 text-sm font-medium" style={{ color: Colors.charcoal[200] }}>Category</Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((c) => (
                    <Chip key={c.id} label={c.name} size="sm" selected={draft.category_id === c.id} onPress={() => setDraft({ ...draft, category_id: c.id })} />
                  ))}
                </View>
              </View>
              <Input label="What was done?" value={draft.description} onChangeText={(v) => setDraft({ ...draft, description: v })} multiline numberOfLines={3} maxLength={1000} autoCapitalize="sentences" />
              <Button label="Upload project" onPress={save} loading={saving} fullWidth />
            </View>
          </ScrollView>
        )}
      </ModalSheet>
    </SafeAreaView>
  );
}
