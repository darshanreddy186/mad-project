import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

/** Cross-platform confirm dialog (Alert.alert is a no-op on react-native-web). */
export function confirm(title: string, message: string, opts: ConfirmOptions = {}): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: opts.cancelText ?? 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: opts.confirmText ?? 'OK',
          style: opts.destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

export function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** Prompts for one of several options; resolves to the chosen value or null. */
export function choose<T extends string>(
  title: string,
  options: { label: string; value: T; destructive?: boolean }[],
  message?: string
): Promise<T | null> {
  if (Platform.OS === 'web') {
    const list = options.map((o, i) => `${i + 1}. ${o.label}`).join('\n');
    const answer = window.prompt(`${title}\n${message ? `${message}\n` : ''}\n${list}\n\nEnter a number:`);
    const index = Number(answer) - 1;
    return Promise.resolve(options[index]?.value ?? null);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        ...options.map((o) => ({
          text: o.label,
          style: o.destructive ? ('destructive' as const) : ('default' as const),
          onPress: () => resolve(o.value),
        })),
        { text: 'Cancel', style: 'cancel' as const, onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
}
