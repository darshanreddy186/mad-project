import { useRouter } from 'expo-router';
import { LogIn, type LucideIcon } from 'lucide-react-native';
import { EmptyState } from './StateViews';

interface SignInPromptProps {
  title?: string;
  message: string;
  icon?: LucideIcon;
}

export function SignInPrompt({ title = 'Sign in required', message, icon = LogIn }: SignInPromptProps) {
  const router = useRouter();
  return (
    <EmptyState
      icon={icon}
      title={title}
      message={message}
      actionLabel="Sign in or create account"
      onAction={() => router.push('/(auth)/login')}
    />
  );
}
