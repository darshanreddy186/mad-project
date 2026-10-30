import { Pressable, Text, View } from 'react-native';
import { FileText, MessageSquare } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ENQUIRY_STATUS } from '@/constants/status';
import { formatPrice, timeAgo } from '@/lib/format';
import type { Enquiry } from '@/types';
import { StatusBadge } from './StatusBadge';

interface EnquiryCardProps {
  enquiry: Enquiry;
  perspective?: 'customer' | 'owner';
  onPress?: () => void;
}

export function EnquiryCard({ enquiry, perspective = 'customer', onPress }: EnquiryCardProps) {
  const status = ENQUIRY_STATUS[enquiry.status];
  const isQuote = enquiry.type === 'quote';
  const Icon = isQuote ? FileText : MessageSquare;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mb-3 rounded-2xl p-4"
      style={{ backgroundColor: Colors.charcoal[800] }}>
      <View className="flex-row items-start gap-3">
        <View
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${isQuote ? Colors.accent[500] : Colors.electric[500]}20` }}>
          <Icon size={16} color={isQuote ? Colors.accent[500] : Colors.electric[400]} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-sm font-semibold text-white" numberOfLines={1}>
              {enquiry.subject}
            </Text>
            <Text className="text-[10px]" style={{ color: Colors.charcoal[500] }}>
              {timeAgo(enquiry.created_at)}
            </Text>
          </View>
          <Text className="mt-0.5 text-xs" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
            {isQuote ? 'Quote request' : 'Enquiry'} ·{' '}
            {perspective === 'owner' ? enquiry.customer_name : (enquiry.shop?.name ?? 'Shop')}
          </Text>
          <Text className="mt-2 text-xs" style={{ color: Colors.charcoal[300] }} numberOfLines={2}>
            {enquiry.message}
          </Text>
          <View className="mt-3 flex-row items-center justify-between">
            <StatusBadge label={status.label} color={status.color} />
            {enquiry.quoted_price !== null && (
              <Text className="text-sm font-bold" style={{ color: Colors.accent[500] }}>
                Quote: {formatPrice(enquiry.quoted_price)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
