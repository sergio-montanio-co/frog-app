import { Pressable, View } from 'react-native'
import { Text } from './Text'
import { cn } from '@/lib/cn'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
}

export type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (next: T) => void
  className?: string
  accessibilityLabel?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        'flex-row items-stretch self-stretch rounded-card border-hairline border-muted bg-background p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            className={cn(
              'flex-1 h-10 items-center justify-center rounded-card',
              selected && 'bg-primary',
            )}
          >
            <Text
              variant="body-em"
              tone={selected ? 'background' : 'foreground'}
            >
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
