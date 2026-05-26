import { Text as RNText, type TextProps } from 'react-native'
import { cn } from '@/lib/cn'

type Variant = 'display' | 'title' | 'body' | 'body-em' | 'caption' | 'button'
type Tone = 'foreground' | 'secondary' | 'muted' | 'primary' | 'background'

const variantStyles: Record<Variant, string> = {
  display: 'text-[28px] leading-9 font-semibold',
  title: 'text-xl leading-7 font-semibold',
  body: 'text-base leading-6 font-sans',
  'body-em': 'text-base leading-6 font-medium',
  caption: 'text-[13px] leading-[18px] font-sans',
  button: 'text-base leading-5 font-semibold',
}

const toneStyles: Record<Tone, string> = {
  foreground: 'text-foreground',
  secondary: 'text-secondary',
  muted: 'text-muted',
  primary: 'text-primary',
  background: 'text-background',
}

export type TextAtomProps = TextProps & {
  variant?: Variant
  tone?: Tone
  className?: string
}

export function Text({
  variant = 'body',
  tone = 'foreground',
  className,
  ...rest
}: TextAtomProps) {
  return (
    <RNText
      className={cn(variantStyles[variant], toneStyles[tone], className)}
      {...rest}
    />
  )
}
