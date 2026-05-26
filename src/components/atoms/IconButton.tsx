import { Pressable, type PressableProps } from 'react-native'
import { Icon, type IconName, type IconSize } from './Icon'
import { cn } from '@/lib/cn'
import { colors } from '@/theme/colors'

type Variant = 'ghost' | 'primary' | 'secondary'

const variantContainer: Record<Variant, string> = {
  ghost: 'bg-transparent',
  primary: 'bg-primary',
  secondary: 'bg-background border-hairline border-muted',
}

const variantIconColor: Record<Variant, string> = {
  ghost: colors.foreground,
  primary: colors.background,
  secondary: colors.primary,
}

export type IconButtonProps = {
  name: IconName
  accessibilityLabel: string
  onPress?: () => void
  variant?: Variant
  size?: IconSize
  disabled?: boolean
  className?: string
  hitSlop?: PressableProps['hitSlop']
}

export function IconButton({
  name,
  accessibilityLabel,
  onPress,
  variant = 'ghost',
  size = 24,
  disabled,
  className,
  hitSlop,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={hitSlop}
      className={cn(
        'h-11 w-11 items-center justify-center rounded-card',
        variantContainer[variant],
        disabled && 'opacity-50',
        className,
      )}
    >
      <Icon name={name} size={size} color={variantIconColor[variant]} />
    </Pressable>
  )
}
