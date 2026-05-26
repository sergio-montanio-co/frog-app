import { forwardRef } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { Text } from './Text'
import { cn } from '@/lib/cn'
import { colors } from '@/theme/colors'

export type InputProps = TextInputProps & {
  label?: string
  error?: string
  className?: string
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, accessibilityLabel, ...rest },
  ref,
) {
  return (
    <View className="gap-2">
      {label ? <Text variant="body-em">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        accessibilityLabel={accessibilityLabel ?? label}
        className={cn(
          'h-12 rounded-card border-hairline border-muted bg-background px-4',
          'text-base font-sans text-foreground',
          error && 'border-primary',
          className,
        )}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="primary">
          {error}
        </Text>
      ) : null}
    </View>
  )
})
