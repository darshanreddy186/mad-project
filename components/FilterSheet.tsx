import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Colors } from '@/constants/theme';
import { DISTANCE_OPTIONS, DISTANCE_UNIT, PRICE_LEVELS } from '@/constants/config';
import { priceLevelSymbols } from '@/lib/format';
import { DEFAULT_FILTERS, useAppStore } from '@/store/useAppStore';
import type { FilterOptions, SortOption } from '@/types';
import { ModalSheet } from './ModalSheet';
import { Button } from './Button';
import { Chip } from './Chip';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  hasLocation: boolean;
}

const SORTS: { label: string; value: SortOption }[] = [
  { label: 'Distance', value: 'distance' },
  { label: 'Rating', value: 'rating' },
  { label: 'Name', value: 'name' },
];

function OptionButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="flex-1 items-center rounded-xl py-2.5"
      style={{ backgroundColor: selected ? Colors.accent[600] : Colors.charcoal[800] }}>
      <Text className="text-xs font-semibold" style={{ color: selected ? Colors.white : Colors.charcoal[300] }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Edits the shared discovery filters (used by the search list and the map). */
export function FilterSheet({ visible, onClose, hasLocation }: FilterSheetProps) {
  const categories = useAppStore((s) => s.categories);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const [local, setLocal] = useState<FilterOptions>(filters);

  useEffect(() => {
    if (visible) setLocal(filters);
  }, [visible, filters]);

  const toggleCategory = (slug: string) =>
    setLocal((prev) => ({
      ...prev,
      categories: prev.categories.includes(slug)
        ? prev.categories.filter((c) => c !== slug)
        : [...prev.categories, slug],
    }));

  const apply = () => {
    setFilters(local);
    onClose();
  };

  const reset = () => {
    setLocal(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    onClose();
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Filters">
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
        <Text className="mb-3 text-sm font-semibold text-white">Category</Text>
        <View className="flex-row flex-wrap gap-2">
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.name}
              size="sm"
              selected={local.categories.includes(cat.slug)}
              onPress={() => toggleCategory(cat.slug)}
            />
          ))}
        </View>

        <Text className="mb-2 mt-5 text-sm font-semibold text-white">Distance</Text>
        {!hasLocation && (
          <Text className="mb-2 text-xs" style={{ color: Colors.charcoal[500] }}>
            Set your location to filter and sort by distance.
          </Text>
        )}
        <View className="flex-row gap-2" style={{ opacity: hasLocation ? 1 : 0.5 }}>
          <OptionButton
            label="Any"
            selected={local.maxDistance === null}
            onPress={() => setLocal((p) => ({ ...p, maxDistance: null }))}
          />
          {DISTANCE_OPTIONS.map((d) => (
            <OptionButton
              key={d}
              label={`${d}${DISTANCE_UNIT}`}
              selected={local.maxDistance === d}
              onPress={() => hasLocation && setLocal((p) => ({ ...p, maxDistance: d }))}
            />
          ))}
        </View>

        <Text className="mb-2 mt-5 text-sm font-semibold text-white">
          Minimum rating
        </Text>
        <View className="flex-row gap-2">
          {[0, 3, 3.5, 4, 4.5].map((r) => (
            <OptionButton
              key={r}
              label={r === 0 ? 'Any' : `${r}+`}
              selected={local.minRating === r}
              onPress={() => setLocal((p) => ({ ...p, minRating: r }))}
            />
          ))}
        </View>

        <Text className="mb-2 mt-5 text-sm font-semibold text-white">Max price level</Text>
        <View className="flex-row gap-2">
          {PRICE_LEVELS.map((p) => (
            <OptionButton
              key={p}
              label={priceLevelSymbols(p)}
              selected={local.maxPriceLevel === p}
              onPress={() => setLocal((prev) => ({ ...prev, maxPriceLevel: p }))}
            />
          ))}
        </View>

        <Text className="mb-2 mt-5 text-sm font-semibold text-white">Sort by</Text>
        <View className="flex-row gap-2">
          {SORTS.map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              selected={local.sortBy === opt.value}
              onPress={() => setLocal((p) => ({ ...p, sortBy: opt.value }))}
            />
          ))}
        </View>

        <View className="mt-6 flex-row gap-3">
          <View className="flex-1">
            <Button label="Reset" variant="outline" onPress={reset} fullWidth />
          </View>
          <View className="flex-1">
            <Button label="Apply" onPress={apply} fullWidth />
          </View>
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

/** Number of non-default filters, for badge display. */
export function activeFilterCount(filters: FilterOptions): number {
  return (
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.maxDistance !== null ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.maxPriceLevel < 4 ? 1 : 0)
  );
}
