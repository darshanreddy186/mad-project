import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pencil, Plus, Trash2, Wrench } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/config';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ModalSheet } from '@/components/ModalSheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Badge } from '@/components/Badge';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { createService, deleteService, listServices, updateService, type ServiceInput } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useAppStore } from '@/store/useAppStore';
import { useOwnerStore } from '@/store/useOwnerStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { formatPriceRange } from '@/lib/format';
import { parseAmount, validateRequired } from '@/lib/validation';
import type { ShopService } from '@/types';

const UNITS = ['per vehicle', 'per hour', 'per session', 'per wheel', 'per set', 'per axle', 'per panel'];

interface FormState {
  id?: string;
  name: string;
  description: string;
  category_id: string | null;
  price_from: string;
  price_to: string;
  unit: string;
  duration: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  name: '',
  description: '',
  category_id: null,
  price_from: '',
  price_to: '',
  unit: 'per vehicle',
  duration: '',
  is_active: true,
};

export default function ManageServicesScreen() {
  const shop = useOwnerStore((s) => s.shop);
  const categories = useAppStore((s) => s.categories);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refresh, refetch, refreshing } = useQuery(() => listServices(shop!.id, true), [shop?.id], {
    enabled: Boolean(shop),
  });

  if (!shop) return <EmptyState title="Register your shop first" />;

  const openEdit = (svc?: ShopService) => {
    setErrors({});
    setForm(
      svc
        ? {
            id: svc.id,
            name: svc.name,
            description: svc.description,
            category_id: svc.category_id,
            price_from: String(svc.price_from),
            price_to: svc.price_to !== null ? String(svc.price_to) : '',
            unit: svc.unit,
            duration: svc.duration_minutes ? String(svc.duration_minutes) : '',
            is_active: svc.is_active,
          }
        : { ...EMPTY, category_id: categories[0]?.id ?? null }
    );
  };

  const save = async () => {
    if (!form) return;
    const from = parseAmount(form.price_from);
    const to = parseAmount(form.price_to);
    const duration = form.duration.trim() ? Number(form.duration) : null;
    const nextErrors = {
      name: validateRequired(form.name, 'Service name', 2),
      price_from: from === null || Number.isNaN(from) ? 'Enter a starting price' : undefined,
      price_to:
        to !== null && (Number.isNaN(to) || (from !== null && to < from)) ? 'Must be at least the starting price' : undefined,
      duration: duration !== null && (!Number.isInteger(duration) || duration < 5) ? 'Minutes, 5 or more' : undefined,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || from === null) return;

    const input: ServiceInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      category_id: form.category_id,
      price_from: from,
      price_to: to,
      unit: form.unit,
      duration_minutes: duration,
      is_active: form.is_active,
    };
    setSaving(true);
    try {
      if (form.id) await updateService(form.id, input);
      else await createService(shop.id, input);
      toast.success(form.id ? 'Service updated.' : 'Service added.');
      setForm(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (svc: ShopService) => {
    if (!(await confirm('Delete service', `Delete "${svc.name}"? Existing bookings keep their details.`, { confirmText: 'Delete', destructive: true }))) return;
    try {
      await deleteService(svc.id);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleActive = async (svc: ShopService) => {
    try {
      await updateService(svc.id, { is_active: !svc.is_active });
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader
        title="Services & pricing"
        subtitle={shop.name}
        right={
          <Pressable onPress={() => openEdit()} accessibilityLabel="Add service" className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: Colors.accent[600] }}>
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
          keyExtractor={(s) => s.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState icon={Wrench} title="No services yet" message="Add the modifications you offer with prices so customers can book." actionLabel="Add a service" onAction={() => openEdit()} />
          }
          renderItem={({ item }) => {
            const cat = categories.find((c) => c.id === item.category_id);
            return (
              <View className="mb-3 rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800], opacity: item.is_active ? 1 : 0.6 }}>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-white">{item.name}</Text>
                    <Text className="mt-1 text-sm font-bold" style={{ color: Colors.accent[500] }}>
                      {formatPriceRange(item.price_from, item.price_to)}{' '}
                      <Text className="text-xs font-normal" style={{ color: Colors.charcoal[400] }}>{item.unit}</Text>
                    </Text>
                    {cat && <View className="mt-2 flex-row"><Badge label={cat.name} color={cat.color} /></View>}
                  </View>
                  <View className="items-end gap-1">
                    <Switch
                      value={item.is_active}
                      onValueChange={() => toggleActive(item)}
                      trackColor={{ true: Colors.success[600], false: Colors.charcoal[600] }}
                      thumbColor={Colors.white}
                    />
                    <Text className="text-[10px]" style={{ color: Colors.charcoal[400] }}>{item.is_active ? 'Visible' : 'Hidden'}</Text>
                  </View>
                </View>
                <View className="mt-3 flex-row justify-end gap-5">
                  <Pressable onPress={() => openEdit(item)} hitSlop={8} className="flex-row items-center gap-1">
                    <Pencil size={13} color={Colors.accent[500]} />
                    <Text className="text-xs font-semibold" style={{ color: Colors.accent[500] }}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(item)} hitSlop={8} className="flex-row items-center gap-1">
                    <Trash2 size={13} color={Colors.error[500]} />
                    <Text className="text-xs font-semibold" style={{ color: Colors.error[500] }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <ModalSheet visible={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? 'Edit service' : 'Add service'}>
        {form && (
          <ScrollView style={{ maxHeight: 560 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="gap-4">
              <Input label="Service name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} autoCapitalize="sentences" error={errors.name} />
              <View>
                <Text className="mb-2 text-sm font-medium" style={{ color: Colors.charcoal[200] }}>Category</Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((c) => (
                    <Chip key={c.id} label={c.name} size="sm" selected={form.category_id === c.id} onPress={() => setForm({ ...form, category_id: c.id })} />
                  ))}
                </View>
              </View>
              <Input label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline numberOfLines={3} maxLength={1000} autoCapitalize="sentences" />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label={`From (${CURRENCY_SYMBOL})`} value={form.price_from} onChangeText={(v) => setForm({ ...form, price_from: v })} keyboardType="decimal-pad" error={errors.price_from} />
                </View>
                <View className="flex-1">
                  <Input label={`To (${CURRENCY_SYMBOL}, optional)`} value={form.price_to} onChangeText={(v) => setForm({ ...form, price_to: v })} keyboardType="decimal-pad" error={errors.price_to} />
                </View>
              </View>
              <View>
                <Text className="mb-2 text-sm font-medium" style={{ color: Colors.charcoal[200] }}>Pricing unit</Text>
                <View className="flex-row flex-wrap gap-2">
                  {UNITS.map((u) => (
                    <Chip key={u} label={u} size="sm" selected={form.unit === u} onPress={() => setForm({ ...form, unit: u })} />
                  ))}
                </View>
              </View>
              <Input label="Typical duration in minutes (optional)" value={form.duration} onChangeText={(v) => setForm({ ...form, duration: v.replace(/[^0-9]/g, '') })} keyboardType="number-pad" error={errors.duration} />
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-white">Visible to customers</Text>
                <Switch value={form.is_active} onValueChange={(v) => setForm({ ...form, is_active: v })} trackColor={{ true: Colors.success[600], false: Colors.charcoal[600] }} thumbColor={Colors.white} />
              </View>
              <Button label={form.id ? 'Save service' : 'Add service'} onPress={save} loading={saving} fullWidth />
            </View>
          </ScrollView>
        )}
      </ModalSheet>
    </SafeAreaView>
  );
}
