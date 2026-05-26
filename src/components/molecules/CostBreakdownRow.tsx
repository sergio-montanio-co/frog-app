import { Pressable, View } from 'react-native'
import {
  IconButton,
  Input,
  MoneyInput,
  Text,
  Icon,
} from '@/components/atoms'
import { colors } from '@/theme/colors'
import { cn } from '@/lib/cn'

export type CostCategory =
  | 'flight'
  | 'lodging'
  | 'transport'
  | 'activity'
  | 'other'

export const COST_CATEGORIES: CostCategory[] = [
  'flight',
  'lodging',
  'transport',
  'activity',
  'other',
]

export type CostBreakdownRowProps = {
  category: CostCategory
  amount: string
  notes?: string
  categoryLabels: Record<CostCategory, string>
  notesPlaceholder: string
  amountLabel: string
  removeAccessibilityLabel: string
  onChangeCategory: (category: CostCategory) => void
  onChangeAmount: (amount: string) => void
  onChangeNotes: (notes: string) => void
  onRemove: () => void
}

export function CostBreakdownRow({
  category,
  amount,
  notes,
  categoryLabels,
  notesPlaceholder,
  amountLabel,
  removeAccessibilityLabel,
  onChangeCategory,
  onChangeAmount,
  onChangeNotes,
  onRemove,
}: CostBreakdownRowProps) {
  return (
    <View className="gap-3 rounded-card border-hairline border-muted p-3">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row flex-wrap gap-1.5">
          {COST_CATEGORIES.map((c) => {
            const active = c === category
            return (
              <Pressable
                key={c}
                onPress={() => onChangeCategory(c)}
                accessibilityRole="button"
                accessibilityLabel={categoryLabels[c]}
                accessibilityState={{ selected: active }}
                className={cn(
                  'h-9 rounded-card px-3 flex-row items-center border-hairline',
                  active
                    ? 'bg-primary border-primary'
                    : 'bg-background border-muted',
                )}
              >
                <Text
                  variant="caption"
                  tone={active ? 'background' : 'foreground'}
                >
                  {categoryLabels[c]}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <IconButton
          name="close"
          variant="ghost"
          accessibilityLabel={removeAccessibilityLabel}
          onPress={onRemove}
        />
      </View>
      <MoneyInput
        label={amountLabel}
        value={amount}
        onChangeText={onChangeAmount}
      />
      <View className="flex-row items-center gap-2">
        <Icon name="notes" size={16} color={colors.secondary} />
        <View className="flex-1">
          <Input
            value={notes ?? ''}
            onChangeText={onChangeNotes}
            placeholder={notesPlaceholder}
            accessibilityLabel={notesPlaceholder}
          />
        </View>
      </View>
    </View>
  )
}
