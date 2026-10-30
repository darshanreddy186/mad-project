import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { isValidTime } from '@/lib/schedule';
import type { OpeningHours } from '@/types';

interface OpeningHoursEditorProps {
  value: OpeningHours[];
  onChange: (value: OpeningHours[]) => void;
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const invalid = value.length > 0 && !isValidTime(value);
  return (
    <TextInput
      value={value}
      onChangeText={(text) => {
        const digits = text.replace(/[^0-9]/g, '').slice(0, 4);
        onChange(digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits);
      }}
      placeholder="09:00"
      placeholderTextColor={Colors.charcoal[600]}
      keyboardType="number-pad"
      maxLength={5}
      className="w-16 rounded-lg px-2 py-1.5 text-center text-sm"
      style={{
        color: Colors.white,
        backgroundColor: Colors.charcoal[900],
        borderWidth: 1,
        borderColor: invalid ? Colors.error[500] : Colors.charcoal[700],
      }}
    />
  );
}

export function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
  const update = (index: number, patch: Partial<OpeningHours>) =>
    onChange(value.map((h, i) => (i === index ? { ...h, ...patch } : h)));

  const copyMondayToWeekdays = () => {
    const monday = value.find((h) => h.day === 'Mon');
    if (!monday) return;
    onChange(
      value.map((h) =>
        ['Tue', 'Wed', 'Thu', 'Fri'].includes(h.day)
          ? { ...h, open: monday.open, close: monday.close, closed: monday.closed }
          : h
      )
    );
  };

  return (
    <View className="rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
      {value.map((h, i) => (
        <View
          key={h.day}
          className="flex-row items-center py-2"
          style={{ borderBottomWidth: i < value.length - 1 ? 1 : 0, borderBottomColor: Colors.charcoal[700] }}>
          <Text className="w-12 text-sm font-semibold text-white">{h.day}</Text>
          <Switch
            value={!h.closed}
            onValueChange={(open) =>
              update(i, open ? { closed: false, open: h.open || '09:00', close: h.close || '17:30' } : { closed: true })
            }
            trackColor={{ true: Colors.accent[600], false: Colors.charcoal[600] }}
            thumbColor={Colors.white}
          />
          {h.closed ? (
            <Text className="ml-3 flex-1 text-sm" style={{ color: Colors.charcoal[500] }}>
              Closed
            </Text>
          ) : (
            <View className="ml-3 flex-1 flex-row items-center justify-end gap-2">
              <TimeInput value={h.open} onChange={(v) => update(i, { open: v })} />
              <Text style={{ color: Colors.charcoal[400] }}>–</Text>
              <TimeInput value={h.close} onChange={(v) => update(i, { close: v })} />
            </View>
          )}
        </View>
      ))}
      <Pressable onPress={copyMondayToWeekdays} className="mt-3 self-start">
        <Text className="text-xs font-semibold" style={{ color: Colors.accent[500] }}>
          Copy Monday to Tue–Fri
        </Text>
      </Pressable>
    </View>
  );
}
