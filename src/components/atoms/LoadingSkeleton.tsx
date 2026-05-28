import { View } from 'react-native'

import { cn } from '@/lib/cn'

export type LoadingSkeletonVariant = 'card' | 'list' | 'inline'

export type LoadingSkeletonProps = {
  lines?: number
  height?: number
  variant?: LoadingSkeletonVariant
  className?: string
  accessibilityLabel?: string
}

export function LoadingSkeleton({
  lines = 3,
  height = 16,
  variant = 'list',
  className,
  accessibilityLabel,
}: LoadingSkeletonProps) {
  const a11y = {
    accessible: true,
    accessibilityRole: 'progressbar' as const,
    accessibilityLabel,
  }

  if (variant === 'card') {
    return (
      <View
        {...a11y}
        className={cn(
          'gap-3 p-4 rounded-card border-hairline border-muted',
          className,
        )}
      >
        <View className="h-5 w-2/3 rounded-full bg-muted/40" />
        <View className="h-3 w-full rounded-full bg-muted/30" />
        <View className="h-3 w-3/4 rounded-full bg-muted/30" />
      </View>
    )
  }

  if (variant === 'list') {
    return (
      <View {...a11y} className={cn('gap-4', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <View
            key={i}
            className="gap-3 p-4 rounded-card border-hairline border-muted"
          >
            <View className="h-4 w-1/3 rounded-full bg-muted/40" />
            <View
              style={{ height }}
              className="w-full rounded-full bg-muted/30"
            />
          </View>
        ))}
      </View>
    )
  }

  return (
    <View
      {...a11y}
      style={{ height }}
      className={cn('rounded-full bg-muted/30', className)}
    />
  )
}
