import { View } from 'react-native'
import { cn } from '@/lib/cn'

export type StepperProps = {
  current: number
  total: number
  accessibilityLabel?: string
  className?: string
}

export function Stepper({
  current,
  total,
  accessibilityLabel,
  className,
}: StepperProps) {
  const safeTotal = Math.max(1, total)
  const safeCurrent = Math.min(Math.max(1, current), safeTotal)
  return (
    <View
      className={cn('flex-row items-center gap-1.5', className)}
      accessibilityRole="progressbar"
      accessibilityLabel={
        accessibilityLabel ?? `Paso ${safeCurrent} de ${safeTotal}`
      }
    >
      {Array.from({ length: safeTotal }).map((_, i) => {
        const isActive = i + 1 <= safeCurrent
        return (
          <View
            key={i}
            className={cn(
              'h-1.5 w-6 rounded-full',
              isActive ? 'bg-primary' : 'bg-muted',
            )}
          />
        )
      })}
    </View>
  )
}
