import { View, Text, ActivityIndicator } from 'react-native';
import { AlertTriangle, Inbox, type LucideIcon } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { Button } from './Button';

export function LoadingView({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color={Colors.accent[500]} />
      {label && (
        <Text className="mt-3 text-sm" style={{ color: Colors.charcoal[400] }}>
          {label}
        </Text>
      )}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-10 py-16">
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: `${Colors.error[500]}20` }}>
        <AlertTriangle size={28} color={Colors.error[500]} />
      </View>
      <Text className="text-base font-semibold text-white">Something went wrong</Text>
      <Text className="mt-2 text-center text-sm" style={{ color: Colors.charcoal[400] }}>
        {message}
      </Text>
      {onRetry && (
        <View className="mt-5">
          <Button label="Try again" variant="outline" onPress={onRetry} />
        </View>
      )}
    </View>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  actionLabel,
  onAction,
  compact,
}: EmptyStateProps) {
  return (
    <View className={`items-center justify-center px-10 ${compact ? 'py-8' : 'flex-1 py-16'}`}>
      <View
        className="mb-4 h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.charcoal[800] }}>
        <Icon size={34} color={Colors.charcoal[500]} />
      </View>
      <Text className="text-center text-base font-semibold text-white">{title}</Text>
      {message && (
        <Text className="mt-2 text-center text-sm" style={{ color: Colors.charcoal[400] }}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-6 w-full">
          <Button label={actionLabel} fullWidth onPress={onAction} />
        </View>
      )}
    </View>
  );
}
