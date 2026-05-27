import { Pressable, type PressableProps } from 'react-native'

import { Text } from './Text'
import { cn } from '@/lib/cn'

export type TogglePillProps = {
  label: string
  active: boolean
  onPress: () => void
  disabled?: boolean
  className?: string
  accessibilityLabel?: PressableProps['accessibilityLabel']
  accessibilityRole?: PressableProps['accessibilityRole']
}

export function TogglePill({
  label,
  active,
  onPress,
  disabled,
  className,
  accessibilityLabel,
  accessibilityRole = 'tab',
}: TogglePillProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: active, disabled }}
      className={cn(
        'h-11 px-4 rounded-card items-center justify-center border-hairline',
        active ? 'bg-primary border-primary' : 'bg-background border-muted',
        disabled && 'opacity-50',
        className,
      )}
    >
      <Text variant="body-em" tone={active ? 'background' : 'foreground'}>
        {label}
      </Text>
    </Pressable>
  )
}
