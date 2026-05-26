import { ActivityIndicator, View } from 'react-native'
import { colors } from '@/theme/colors'

export function Splash() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color={colors.primary} />
    </View>
  )
}
