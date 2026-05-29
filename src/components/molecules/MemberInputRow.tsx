import { View } from 'react-native'
import { IconButton, Input } from '@/components/atoms'
import type { IconName } from '@/components/atoms'

export type MemberContact = {
  name: string
  email?: string
  phone?: string
}

export type MemberInputRowProps = {
  index: number
  name: string
  contact: string
  contactError?: string
  nameError?: string
  removeAccessibilityLabel: string
  namePlaceholder: string
  contactPlaceholder: string
  onChangeName: (value: string) => void
  onChangeContact: (value: string) => void
  onRemove: () => void
}

function detectContactIcon(value: string): IconName | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.includes('@')) return 'mail-outline'
  if (/^[+\d]/.test(trimmed)) return 'phone'
  return undefined
}

export function MemberInputRow({
  name,
  contact,
  contactError,
  nameError,
  removeAccessibilityLabel,
  namePlaceholder,
  contactPlaceholder,
  onChangeName,
  onChangeContact,
  onRemove,
}: MemberInputRowProps) {
  return (
    <View className="flex-row items-start gap-2">
      <View className="flex-1 gap-2">
        <Input
          value={name}
          onChangeText={onChangeName}
          placeholder={namePlaceholder}
          accessibilityLabel={namePlaceholder}
          error={nameError}
          autoCapitalize="words"
        />
        <Input
          value={contact}
          onChangeText={onChangeContact}
          placeholder={contactPlaceholder}
          accessibilityLabel={contactPlaceholder}
          error={contactError}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          leadingIcon={detectContactIcon(contact)}
        />
      </View>
      <IconButton
        name="close"
        variant="secondary"
        accessibilityLabel={removeAccessibilityLabel}
        onPress={onRemove}
      />
    </View>
  )
}
