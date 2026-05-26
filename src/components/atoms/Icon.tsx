import { MaterialIcons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

export type IconName = keyof typeof MaterialIcons.glyphMap
export type IconSize = 16 | 20 | 24 | 32

export type IconProps = {
  name: IconName
  size?: IconSize
  color?: string
  accessibilityLabel?: string
}

export function Icon({
  name,
  size = 20,
  color = colors.foreground,
  accessibilityLabel,
}: IconProps) {
  return (
    <MaterialIcons
      name={name}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel}
      accessible={accessibilityLabel != null}
    />
  )
}
