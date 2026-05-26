import { Pressable, ActivityIndicator, type PressableProps } from 'react-native'
import { Text } from './Text'
import { cn } from '@/lib/cn'
import { colors } from '@/theme/colors'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const base = 'flex-row items-center justify-center rounded-card'

const variantContainer: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-background border-hairline border-primary',
  ghost: 'bg-transparent',
}

const sizeContainer: Record<Size, string> = {
  md: 'h-12 px-4',
  lg: 'h-14 px-5',
}

const textTone: Record<Variant, 'background' | 'primary'> = {
  primary: 'background',
  secondary: 'primary',
  ghost: 'primary',
}

export type ButtonProps = {
  label: string
  onPress?: () => void
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  className?: string
  accessibilityLabel?: PressableProps['accessibilityLabel']
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  accessibilityLabel,
}: ButtonProps) {
  const isInactive = disabled || loading
  return (
    <Pressable
      onPress={isInactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      className={cn(
        base,
        variantContainer[variant],
        sizeContainer[size],
        isInactive && 'opacity-50',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.background : colors.primary}
        />
      ) : (
        <Text variant="button" tone={textTone[variant]}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}
