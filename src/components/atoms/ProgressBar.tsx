import { View } from 'react-native'
import { cn } from '@/lib/cn'

export type ProgressBarProps = {
  percent: number
  className?: string
  accessibilityLabel?: string
}

export function ProgressBar({
  percent,
  className,
  accessibilityLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ now: Math.round(clamped), min: 0, max: 100 }}
      className={cn('h-1.5 w-full rounded-full bg-muted/40 overflow-hidden', className)}
    >
      <View
        style={{ width: `${clamped}%` }}
        className="h-full rounded-full bg-primary"
      />
    </View>
  )
}
