import { View, type ViewProps } from 'react-native'
import { cn } from '@/lib/cn'

export type CardProps = ViewProps & { className?: string }

export function Card({ className, ...rest }: CardProps) {
  return (
    <View
      className={cn(
        'border-hairline border-muted rounded-card p-4 bg-background',
        className,
      )}
      {...rest}
    />
  )
}
