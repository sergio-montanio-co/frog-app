import { useState } from 'react'
import { Modal, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button, Input, Text } from '@/components/atoms'
import { parseBackendError } from '@/lib/api/errors'
import { useInviteMember } from '@/lib/api/queries'
import { detectContactKind } from '@/lib/trips/wizard'

export type InviteLateDialogProps = {
  open: boolean
  tripId: string
  onClose: () => void
}

export function InviteLateDialog({
  open,
  tripId,
  onClose,
}: InviteLateDialogProps) {
  const { t } = useTranslation()
  const invite = useInviteMember(tripId)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const trimmedName = name.trim()
  const trimmedContact = contact.trim()
  const contactKind = detectContactKind(trimmedContact)

  const nameError =
    trimmedName.length < 1
      ? t('trips.admin.inviteLate.error.nameRequired')
      : undefined
  const contactError =
    trimmedContact.length === 0 || contactKind === 'unknown'
      ? t('trips.admin.inviteLate.error.contactInvalid')
      : undefined
  const canSubmit = !nameError && !contactError

  function resetAndClose() {
    setName('')
    setContact('')
    setTouched(false)
    setSubmitError(null)
    onClose()
  }

  async function onSubmit() {
    setTouched(true)
    if (!canSubmit) return
    setSubmitError(null)
    try {
      await invite.mutateAsync({
        name: trimmedName,
        email:
          contactKind === 'email'
            ? trimmedContact.toLowerCase()
            : undefined,
        phone:
          contactKind === 'phone'
            ? trimmedContact.replace(/\s+/g, '')
            : undefined,
      })
      resetAndClose()
    } catch (err) {
      setSubmitError(parseBackendError(err))
    }
  }

  const visibleNameError = touched ? nameError : undefined
  const visibleContactError = touched ? contactError : undefined

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={resetAndClose}
    >
      <View className="flex-1 items-center justify-center bg-foreground/40 px-6">
        <View className="w-full max-w-md gap-4 rounded-card border-hairline border-muted bg-background p-5">
          <Text variant="title">
            {t('trips.admin.inviteLate.title')}
          </Text>
          <Text variant="body" tone="secondary">
            {t('trips.admin.inviteLate.helper')}
          </Text>

          <View className="gap-3">
            <Input
              value={name}
              onChangeText={(v) => {
                setName(v)
                setSubmitError(null)
              }}
              placeholder={t('trips.admin.inviteLate.namePlaceholder')}
              accessibilityLabel={t('trips.admin.inviteLate.namePlaceholder')}
              autoCapitalize="words"
              error={visibleNameError}
              maxLength={80}
            />
            <Input
              value={contact}
              onChangeText={(v) => {
                setContact(v)
                setSubmitError(null)
              }}
              placeholder={t('trips.admin.inviteLate.contactPlaceholder')}
              accessibilityLabel={t(
                'trips.admin.inviteLate.contactPlaceholder',
              )}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              error={visibleContactError}
              maxLength={120}
              leadingIcon={
                contact.trim().includes('@')
                  ? 'mail-outline'
                  : /^[+\d]/.test(contact.trim())
                    ? 'phone'
                    : undefined
              }
            />
          </View>

          {submitError ? (
            <View className="rounded-card border-hairline border-primary p-3">
              <Text variant="caption" tone="primary">
                {submitError}
              </Text>
            </View>
          ) : null}

          <View className="gap-2 pt-2">
            <Button
              label={t('trips.admin.inviteLate.submit')}
              variant="primary"
              onPress={onSubmit}
              loading={invite.isPending}
              disabled={invite.isPending}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={resetAndClose}
              disabled={invite.isPending}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}
