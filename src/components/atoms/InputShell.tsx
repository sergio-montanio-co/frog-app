import { type ReactNode } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'
import { cn } from '@/lib/cn'
import { colors } from '@/theme/colors'

// Quicksand en iOS rendiza el texto con un ascender padding generoso, así que
// el cuerpo visible del texto queda ligeramente debajo del centro geométrico
// de la línea. Para alinear icono ↔ texto sin tocar el TextInput (que clipea
// glyphs o desincroniza placeholder/texto si lo manipulas), nudgeamos los
// iconos hacia abajo aquí. Ajustar este número si la alineación se ve off.
const ICON_VERTICAL_NUDGE: { marginTop: number } | undefined =
  Platform.OS === 'ios' ? { marginTop: 2 } : undefined

export type InputShellProps = {
  label?: string
  helperText?: string
  error?: string
  focused?: boolean
  disabled?: boolean
  multiline?: boolean
  leadingIcon?: IconName
  leadingContent?: ReactNode
  trailingIcon?: IconName
  onTrailingIconPress?: () => void
  trailingAccessibilityLabel?: string
  className?: string
  children: ReactNode
}

export function InputShell({
  label,
  helperText,
  error,
  focused,
  disabled,
  multiline,
  leadingIcon,
  leadingContent,
  trailingIcon,
  onTrailingIconPress,
  trailingAccessibilityLabel,
  className,
  children,
}: InputShellProps) {
  return (
    <View className="gap-2">
      {label ? <Text variant="body-em">{label}</Text> : null}

      <View
        className={cn(
          'flex-row gap-2 rounded-card border bg-foreground/[0.03] px-4',
          multiline ? 'min-h-14 items-start py-3' : 'min-h-14 items-center py-3',
          !error && !focused && 'border-muted',
          !error && focused && 'border-foreground/60',
          error && 'border-primary',
          disabled && 'opacity-50',
          className,
        )}
      >
        {leadingContent ? (
          <View className={cn(multiline && 'pt-0.5')}>{leadingContent}</View>
        ) : leadingIcon ? (
          <View
            className={cn(multiline && 'pt-0.5')}
            style={multiline ? undefined : ICON_VERTICAL_NUDGE}
          >
            <Icon name={leadingIcon} size={20} color={colors.secondary} />
          </View>
        ) : null}

        <View className="flex-1">{children}</View>

        {trailingIcon ? (
          <Pressable
            onPress={onTrailingIconPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={trailingAccessibilityLabel}
            disabled={disabled || !onTrailingIconPress}
            className={cn(multiline && 'pt-0.5')}
            style={multiline ? undefined : ICON_VERTICAL_NUDGE}
          >
            <Icon name={trailingIcon} size={20} color={colors.secondary} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" tone="primary">
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" tone="secondary">
          {helperText}
        </Text>
      ) : null}
    </View>
  )
}
