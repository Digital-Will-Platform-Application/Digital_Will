import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/lib/theme';
import { radius } from '@/lib/theme';

type Props = PressableProps & {
  title: string;
  iconLeft?: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

export function PrimaryButton({ title, iconLeft, loading, variant = 'primary', disabled, style, ...rest }: Props) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;
  const isGhost = variant === 'ghost';

  const styleFn = (state: PressableStateCallbackType): StyleProp<ViewStyle> => ([
    styles.base,
    isGhost
      ? { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }
      : { backgroundColor: colors.gold, borderColor: colors.gold, borderWidth: 1 },
    isDisabled ? { opacity: 0.65 } : null,
    typeof style === 'function' ? style(state) : style,
  ] as StyleProp<ViewStyle>);

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={styleFn}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator size="small" color={isGhost ? colors.foreground : colors.goldForeground} />
        ) : (
          iconLeft ?? null
        )}
        <Text style={[styles.text, { color: isGhost ? colors.foreground : colors.goldForeground }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: { fontWeight: '700', fontSize: 15 },
});

