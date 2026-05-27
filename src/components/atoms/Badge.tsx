import { View, type ViewProps } from 'react-native'
import { Text } from './Text'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'primary' | 'subtle'

const containerTone: Record<BadgeTone, string> = {
  neutral: 'bg-muted/30',
  primary: 'bg-primary',
  subtle: 'bg-transparent border-hairline border-muted',
}

const textTone: Record<BadgeTone, 'foreground' | 'background' | 'secondary'> = {
  neutral: 'foreground',
  primary: 'background',
  subtle: 'secondary',
}

export type BadgeProps = ViewProps & {
  label: string
  tone?: BadgeTone
  className?: string
}

export function Badge({
  label,
  tone = 'neutral',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <View
      className={cn(
        'flex-row items-center self-start px-2.5 py-1 rounded-full gap-1',
        containerTone[tone],
        className,
      )}
      {...rest}
    >
      {children}
      <Text variant="caption" tone={textTone[tone]} className="font-medium">
        {label}
      </Text>
    </View>
  )
}
