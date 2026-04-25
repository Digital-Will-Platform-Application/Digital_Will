import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useAppTheme } from '@/lib/theme';
import { radius } from '@/lib/theme';

export function Card({ children, style, ...rest }: ViewProps & { children: ReactNode }) {
  const { colors, isDark } = useAppTheme();
  return (
    <View
      {...rest}
      style={[
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: isDark ? '#000000' : colors.primary,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
});

