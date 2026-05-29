import { useState } from 'react'
import { Modal, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button, Input, Text } from '@/components/atoms'
import { parseBackendError } from '@/lib/api/errors'
import { useRejectContribution } from '@/lib/api/queries'

export type RejectDialogProps = {
  open: boolean
  tripId: string
  contributionId: string | null
  onClose: () => void
  onRejected?: () => void
}

const MIN_LEN = 3
const MAX_LEN = 500

export function RejectDialog({
  open,
  tripId,
  contributionId,
  onClose,
  onRejected,
}: RejectDialogProps) {
  const { t } = useTranslation()
  const reject = useRejectContribution(tripId)
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const trimmed = reason.trim()
  const validationError =
    trimmed.length === 0
      ? t('trips.organizer.reject.error.required')
      : trimmed.length < MIN_LEN
        ? t('trips.organizer.reject.error.tooShort')
        : trimmed.length > MAX_LEN
          ? t('trips.organizer.reject.error.tooLong')
          : undefined
  const canSubmit = !validationError

  function resetAndClose() {
    setReason('')
    setTouched(false)
    setSubmitError(null)
    onClose()
  }

  async function onConfirm() {
    if (!contributionId) return
    setTouched(true)
    if (!canSubmit) return
    setSubmitError(null)
    try {
      await reject.mutateAsync({ id: contributionId, reason: trimmed })
      onRejected?.()
      resetAndClose()
    } catch (err) {
      setSubmitError(parseBackendError(err))
    }
  }

  const visibleError = touched ? validationError : undefined

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={resetAndClose}
    >
      <View className="flex-1 items-center justify-center bg-foreground/40 px-6">
        <View className="w-full max-w-md gap-4 rounded-card border-hairline border-muted bg-background p-5">
          <Text variant="title">{t('trips.organizer.reject.title')}</Text>
          <Text variant="body" tone="secondary">
            {t('trips.organizer.reject.body')}
          </Text>

          <View className="gap-2">
            <Input
              label={t('trips.organizer.reject.reasonLabel')}
              value={reason}
              onChangeText={(v) => {
                setReason(v)
                setSubmitError(null)
              }}
              onBlur={() => setTouched(true)}
              placeholder={t('trips.organizer.reject.reasonPlaceholder')}
              multiline
              numberOfLines={3}
              maxLength={MAX_LEN}
              accessibilityLabel={t('trips.organizer.reject.reasonLabel')}
              error={visibleError}
            />
            <Text variant="caption" tone="secondary" className="self-end">
              {t('trips.organizer.reject.counter', { count: reason.length })}
            </Text>
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
              label={t('trips.organizer.reject.confirm')}
              variant="primary"
              onPress={onConfirm}
              loading={reject.isPending}
              disabled={!canSubmit || reject.isPending}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={resetAndClose}
              disabled={reject.isPending}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}
