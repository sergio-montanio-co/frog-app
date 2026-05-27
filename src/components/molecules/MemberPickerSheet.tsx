import { FlatList, Modal, Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Avatar, Divider, IconButton, Text } from '@/components/atoms'
import type { TripMember } from '@/lib/api/queries'
import { resolveMemberName } from '@/lib/trips/helpers'

export type MemberPickerSheetProps = {
  open: boolean
  members: TripMember[]
  selectedMemberId?: string | null
  onSelect: (member: TripMember) => void
  onClose: () => void
  title?: string
  showAllOption?: boolean
  allOptionLabel?: string
  onSelectAll?: () => void
}

export function MemberPickerSheet({
  open,
  members,
  selectedMemberId,
  onSelect,
  onClose,
  title,
  showAllOption,
  allOptionLabel,
  onSelectAll,
}: MemberPickerSheetProps) {
  const { t } = useTranslation()
  const heading = title ?? t('trips.organizer.memberPicker.title')

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-foreground/40">
        <View className="max-h-[70%] gap-3 rounded-t-card border-hairline border-muted bg-background p-4">
          <View className="items-center">
            <View className="h-1 w-10 rounded-full bg-muted" />
          </View>
          <View className="flex-row items-center justify-between">
            <Text variant="title">{heading}</Text>
            <IconButton
              name="close"
              variant="ghost"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
            />
          </View>
          <Divider />
          {members.length === 0 && !showAllOption ? (
            <Text variant="body" tone="secondary">
              {t('trips.organizer.memberPicker.empty')}
            </Text>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(m) => m.id}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                showAllOption ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      allOptionLabel ?? t('common.all')
                    }
                    accessibilityState={{ selected: !selectedMemberId }}
                    onPress={() => {
                      onSelectAll?.()
                      onClose()
                    }}
                    className="flex-row items-center gap-3 py-3"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full border-hairline border-muted">
                      <Text variant="body-em" tone="secondary">
                        ·
                      </Text>
                    </View>
                    <Text
                      variant={selectedMemberId ? 'body' : 'body-em'}
                      tone={selectedMemberId ? 'foreground' : 'primary'}
                      className="flex-1"
                    >
                      {allOptionLabel ?? t('common.all')}
                    </Text>
                  </Pressable>
                ) : null
              }
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item }) => {
                const name = resolveMemberName(item)
                const isSelected = selectedMemberId === item.id
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={name}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onSelect(item)
                      onClose()
                    }}
                    className="flex-row items-center gap-3 py-3"
                  >
                    <Avatar
                      uri={item.user?.avatarUrl}
                      name={name}
                      size={40}
                    />
                    <Text
                      variant={isSelected ? 'body-em' : 'body'}
                      tone={isSelected ? 'primary' : 'foreground'}
                      className="flex-1"
                      numberOfLines={1}
                    >
                      {name || '—'}
                    </Text>
                  </Pressable>
                )
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}
