import { View } from 'react-native'
import { cn } from '@/lib/cn'

export type DividerProps = {
  className?: string
  spacing?: 'none' | 'sm' | 'md' | 'lg'
}

const spacingClass: Record<NonNullable<DividerProps['spacing']>, string> = {
  none: '',
  sm: 'my-2',
  md: 'my-4',
  lg: 'my-6',
}

export function Divider({ className, spacing = 'none' }: DividerProps) {
  return (
    <View
      accessibilityRole="none"
      className={cn('h-[0.5px] w-full bg-muted', spacingClass[spacing], className)}
    />
  )
}
