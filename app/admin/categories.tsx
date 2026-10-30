import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LucideIcons from 'lucide-react-native';
import { LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ModalSheet } from '@/components/ModalSheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { createCategory, deleteCategory, listCategories, slugify, updateCategory } from '@/api/categories';
import { useQuery } from '@/hooks/useQuery';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { validateRequired } from '@/lib/validation';
import type { ServiceCategory } from '@/types';

const ICONS = ['Gauge', 'Car', 'CircleDot', 'ChevronsUpDown', 'Volume2', 'Palette', 'Lightbulb', 'ShieldCheck', 'Wrench', 'Zap', 'Sparkles', 'Fuel', 'Cog', 'Paintbrush', 'Disc3', 'Wind'];
const COLORS = ['#ff7d12', '#326bff', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16', '#f43f5e'];

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;
const iconFor = (name: string): IconComponent =>
  (LucideIcons as unknown as Record<string, IconComponent>)[name] ?? LucideIcons.Wrench;

type Draft = Omit<ServiceCategory, 'id' | 'sort_order'> & { id?: string; sort_order: string };

export default function AdminCategoriesScreen() {
  const reloadPublic = useAppStore((s) => s.loadCategories);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refresh, refreshing, refetch } = useQuery(() => listCategories(true), []);

  const afterChange = () => {
    refetch();
    reloadPublic(true);
  };

  const open = (c?: ServiceCategory) => {
    setErrors({});
    setDraft(
      c
        ? { ...c, sort_order: String(c.sort_order) }
        : { name: '', slug: '', description: '', icon_name: 'Wrench', color: COLORS[0]!, is_active: true, sort_order: String(((data?.length ?? 0) + 1) * 10) }
    );
  };

  const save = async () => {
    if (!draft) return;
    const slug = draft.slug || slugify(draft.name);
    const nextErrors = {
      name: validateRequired(draft.name, 'Name', 2),
      slug: /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ? undefined : 'Lowercase letters, numbers and dashes only',
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.slug) return;
    const input = {
      name: draft.name.trim(),
      slug,
      description: draft.description.trim(),
      icon_name: draft.icon_name,
      color: draft.color,
      is_active: draft.is_active,
      sort_order: Number(draft.sort_order) || 0,
    };
    setSaving(true);
    try {
      if (draft.id) await updateCategory(draft.id, input);
      else await createCategory(input);
      toast.success('Category saved.');
      setDraft(null);
      afterChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: ServiceCategory) => {
    if (!(await confirm('Delete category', `Delete "${c.name}"? Services in this category become uncategorised. Consider hiding it instead.`, { confirmText: 'Delete', destructive: true }))) return;
    try {
      await deleteCategory(c.id);
      afterChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggle = async (c: ServiceCategory) => {
    try {
      await updateCategory(c.id, { is_active: !c.is_active });
      afterChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader
        title="Categories"
        right={
          <Pressable onPress={() => open()} accessibilityLabel="Add category" className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: Colors.accent[600] }}>
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
          keyExtractor={(c) => c.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState icon={LayoutGrid} title="No categories" actionLabel="Add category" onAction={() => open()} />}
          renderItem={({ item }) => {
            const Icon = iconFor(item.icon_name);
            return (
              <View className="mb-2 flex-row items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: Colors.charcoal[800], opacity: item.is_active ? 1 : 0.55 }}>
                <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}25` }}>
                  <Icon size={18} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">{item.name}</Text>
                  <Text className="text-[11px]" style={{ color: Colors.charcoal[400] }}>{item.slug} · order {item.sort_order}</Text>
                </View>
                <Switch value={item.is_active} onValueChange={() => toggle(item)} trackColor={{ true: Colors.success[600], false: Colors.charcoal[600] }} thumbColor={Colors.white} />
                <Pressable onPress={() => open(item)} hitSlop={8} accessibilityLabel="Edit"><Pencil size={16} color={Colors.accent[500]} /></Pressable>
                <Pressable onPress={() => remove(item)} hitSlop={8} accessibilityLabel="Delete"><Trash2 size={16} color={Colors.error[500]} /></Pressable>
              </View>
            );
          }}
        />
      )}

      <ModalSheet visible={Boolean(draft)} onClose={() => setDraft(null)} title={draft?.id ? 'Edit category' : 'New category'}>
        {draft && (
          <ScrollView style={{ maxHeight: 560 }} keyboardShouldPersistTaps="handled">
            <View className="gap-4">
              <Input label="Name" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v, slug: draft.id ? draft.slug : slugify(v) })} autoCapitalize="words" error={errors.name} />
              <Input label="Slug" value={draft.slug} onChangeText={(v) => setDraft({ ...draft, slug: v })} error={errors.slug} hint="Used in links and filters" />
              <Input label="Description" value={draft.description} onChangeText={(v) => setDraft({ ...draft, description: v })} multiline numberOfLines={2} maxLength={300} autoCapitalize="sentences" />
              <View>
                <Text className="mb-2 text-sm font-medium" style={{ color: Colors.charcoal[200] }}>Icon</Text>
                <View className="flex-row flex-wrap gap-2">
                  {ICONS.map((name) => {
                    const Icon = iconFor(name);
                    const selected = draft.icon_name === name;
                    return (
                      <Pressable key={name} onPress={() => setDraft({ ...draft, icon_name: name })} accessibilityLabel={name} className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: selected ? `${draft.color}35` : Colors.charcoal[800], borderWidth: selected ? 1.5 : 0, borderColor: draft.color }}>
                        <Icon size={18} color={selected ? draft.color : Colors.charcoal[300]} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View>
                <Text className="mb-2 text-sm font-medium" style={{ color: Colors.charcoal[200] }}>Colour</Text>
                <View className="flex-row flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <Pressable key={c} onPress={() => setDraft({ ...draft, color: c })} accessibilityLabel={c} className="h-8 w-8 rounded-full" style={{ backgroundColor: c, borderWidth: draft.color === c ? 3 : 0, borderColor: Colors.white }} />
                  ))}
                </View>
              </View>
              <Input label="Sort order" value={draft.sort_order} onChangeText={(v) => setDraft({ ...draft, sort_order: v.replace(/[^0-9]/g, '') })} keyboardType="number-pad" />
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-white">Visible to users</Text>
                <Switch value={draft.is_active} onValueChange={(v) => setDraft({ ...draft, is_active: v })} trackColor={{ true: Colors.success[600], false: Colors.charcoal[600] }} thumbColor={Colors.white} />
              </View>
              <Button label="Save category" onPress={save} loading={saving} fullWidth />
            </View>
          </ScrollView>
        )}
      </ModalSheet>
    </SafeAreaView>
  );
}
