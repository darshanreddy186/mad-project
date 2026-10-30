import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  max?: number;
}

export function TagInput({ label, value, onChange, placeholder = 'Add…', suggestions = [], max = 30 }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const tag = raw.trim().replace(/\s+/g, ' ');
    if (!tag || value.length >= max) return;
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
    setDraft('');
  };

  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

  return (
    <View className="w-full">
      {label && (
        <Text className="mb-2 text-sm font-medium" style={{ color: Colors.charcoal[200] }}>
          {label}
        </Text>
      )}
      <View className="flex-row flex-wrap gap-2">
        {value.map((tag) => (
          <View
            key={tag}
            className="flex-row items-center gap-1 rounded-full py-1.5 pl-3 pr-2"
            style={{ backgroundColor: Colors.charcoal[700] }}>
            <Text className="text-xs font-medium text-white">{tag}</Text>
            <Pressable
              onPress={() => onChange(value.filter((v) => v !== tag))}
              hitSlop={8}
              accessibilityLabel={`Remove ${tag}`}>
              <X size={12} color={Colors.charcoal[300]} />
            </Pressable>
          </View>
        ))}
      </View>
      <View
        className="mt-2 flex-row items-center rounded-xl"
        style={{ backgroundColor: Colors.charcoal[800], borderWidth: 1, borderColor: Colors.charcoal[700] }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => add(draft)}
          placeholder={placeholder}
          placeholderTextColor={Colors.charcoal[500]}
          returnKeyType="done"
          blurOnSubmit={false}
          className="flex-1 px-4 py-3 text-sm"
          style={{ color: Colors.white }}
        />
        <Pressable onPress={() => add(draft)} className="px-3.5" accessibilityLabel="Add">
          <Plus size={18} color={Colors.accent[500]} />
        </Pressable>
      </View>
      {remaining.length > 0 && (
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {remaining.slice(0, 12).map((s) => (
            <Pressable
              key={s}
              onPress={() => add(s)}
              className="rounded-full px-2.5 py-1"
              style={{ borderWidth: 1, borderColor: Colors.charcoal[700] }}>
              <Text className="text-[11px]" style={{ color: Colors.charcoal[300] }}>
                + {s}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
