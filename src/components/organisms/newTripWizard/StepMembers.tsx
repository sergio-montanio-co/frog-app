import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button, Text } from '@/components/atoms'
import { MemberInputRow, WizardStep } from '@/components/molecules'

import {
  MAX_MEMBERS,
  detectContactKind,
  validateStep,
} from '@/lib/trips/wizard'

import type { StepProps } from './StepBasics'

export function StepMembers({ draft, onChange }: StepProps) {
  const { t } = useTranslation()
  const validation = validateStep(4, draft)
  const issues = validation.success ? {} : validation.issues
  const duplicateEmail = issues['members'] === 'duplicate_email'
  const duplicatePhone = issues['members'] === 'duplicate_phone'

  const memberErrors = draft.members.map((m) => {
    const trimmed = m.contact.trim()
    const kind = detectContactKind(trimmed)
    if (!trimmed) return undefined
    if (kind === 'unknown')
      return t('trips.new.step4.errors.contactInvalid')
    return undefined
  })

  return (
    <WizardStep
      title={t('trips.new.step4.title')}
      subtitle={t('trips.new.step4.subtitle')}
    >
      {draft.members.length === 0 ? (
        <View className="rounded-card border-hairline border-muted p-6 items-center gap-2">
          <Text variant="body" tone="secondary" className="text-center">
            {t('trips.new.step4.empty')}
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          {draft.members.map((m, i) => (
            <MemberInputRow
              key={i}
              index={i}
              name={m.name}
              contact={m.contact}
              contactError={memberErrors[i]}
              namePlaceholder={t('trips.new.step4.namePlaceholder')}
              contactPlaceholder={t('trips.new.step4.contactPlaceholder')}
              removeAccessibilityLabel={t('trips.new.step4.removeMember')}
              onChangeName={(name) => {
                const next = [...draft.members]
                next[i] = { ...next[i], name }
                onChange({ ...draft, members: next })
              }}
              onChangeContact={(contact) => {
                const next = [...draft.members]
                next[i] = { ...next[i], contact }
                onChange({ ...draft, members: next })
              }}
              onRemove={() => {
                const next = draft.members.filter((_, idx) => idx !== i)
                onChange({ ...draft, members: next })
              }}
            />
          ))}
        </View>
      )}

      {duplicateEmail ? (
        <Text variant="caption" tone="primary">
          {t('trips.new.step4.errors.duplicateEmail')}
        </Text>
      ) : null}
      {duplicatePhone ? (
        <Text variant="caption" tone="primary">
          {t('trips.new.step4.errors.duplicatePhone')}
        </Text>
      ) : null}

      <Button
        label={t('trips.new.step4.addMember')}
        variant="secondary"
        disabled={draft.members.length >= MAX_MEMBERS}
        onPress={() =>
          onChange({
            ...draft,
            members: [...draft.members, { name: '', contact: '' }],
          })
        }
      />

      <Text variant="caption" tone="secondary">
        {t('trips.new.step4.helper')}
      </Text>
    </WizardStep>
  )
}
