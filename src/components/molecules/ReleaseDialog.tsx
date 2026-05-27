import { useState } from 'react'
import { Modal, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  Button,
  Card,
  ConfirmDialog,
  Icon,
  Text,
} from '@/components/atoms'
import { colors } from '@/theme/colors'
import { parseBackendError } from '@/lib/api/errors'
import { useReleaseSavingsPlan } from '@/lib/api/queries'

import { WarningsListDialog } from './WarningsListDialog'

export type ReleaseDialogProps = {
  open: boolean
  tripId: string
  tripName: string
  planId: string
  pendingCount: number
  onClose: () => void
  onReviewPending?: () => void
}

const NOTES_MAX = 1000

export function ReleaseDialog({
  open,
  tripId,
  tripName,
  planId,
  pendingCount,
  onClose,
  onReviewPending,
}: ReleaseDialogProps) {
  const { t } = useTranslation()
  const release = useReleaseSavingsPlan(tripId)
  const [notes, setNotes] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmAnywayOpen, setConfirmAnywayOpen] = useState(false)
  const [warnings, setWarnings] = useState<string[] | null>(null)

  function resetAndClose() {
    setNotes('')
    setSubmitError(null)
    setWarnings(null)
    setConfirmAnywayOpen(false)
    onClose()
  }

  async function doRelease() {
    setSubmitError(null)
    try {
      const result = await release.mutateAsync({
        planId,
        notes: notes.trim() ? notes.trim() : undefined,
      })
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings)
        return
      }
      resetAndClose()
    } catch (err) {
      setSubmitError(parseBackendError(err))
    }
  }

  function onConfirm() {
    if (pendingCount > 0) {
      setConfirmAnywayOpen(true)
      return
    }
    void doRelease()
  }

  if (warnings) {
    return (
      <WarningsListDialog
        open
        warnings={warnings}
        onClose={resetAndClose}
      />
    )
  }

  return (
    <>
      <Modal
        visible={open && !confirmAnywayOpen}
        transparent
        animationType="fade"
        onRequestClose={resetAndClose}
      >
        <View className="flex-1 items-center justify-center bg-foreground/40 px-6">
          <View className="w-full max-w-md gap-4 rounded-card border-hairline border-muted bg-background p-5">
            <View className="flex-row items-center gap-2">
              <Icon name="savings" size={20} color={colors.primary} />
              <Text variant="title" className="flex-1">
                {t('trips.admin.release.dialog.title', { tripName })}
              </Text>
            </View>

            {pendingCount > 0 ? (
              <Card className="gap-3">
                <View className="flex-row items-start gap-2">
                  <Icon name="warning" size={20} color={colors.primary} />
                  <Text variant="body" tone="secondary" className="flex-1">
                    {t('trips.admin.release.pendingWarning', {
                      count: pendingCount,
                    })}
                  </Text>
                </View>
                {onReviewPending ? (
                  <Button
                    label={t('trips.admin.release.reviewPending')}
                    variant="primary"
                    onPress={() => {
                      resetAndClose()
                      onReviewPending()
                    }}
                  />
                ) : null}
                <Button
                  label={t('trips.admin.release.releaseAnyway')}
                  variant="ghost"
                  onPress={onConfirm}
                />
                <Button
                  label={t('common.cancel')}
                  variant="ghost"
                  onPress={resetAndClose}
                />
              </Card>
            ) : (
              <>
                <Text variant="body" tone="secondary">
                  {t('trips.admin.release.dialog.body')}
                </Text>

                <View className="gap-2">
                  <Text variant="body-em">
                    {t('trips.admin.release.dialog.notesLabel')}
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={(v) => {
                      setNotes(v)
                      setSubmitError(null)
                    }}
                    placeholder={t(
                      'trips.admin.release.dialog.notesPlaceholder',
                    )}
                    placeholderTextColor={colors.muted}
                    multiline
                    maxLength={NOTES_MAX}
                    accessibilityLabel={t(
                      'trips.admin.release.dialog.notesLabel',
                    )}
                    className="min-h-[96px] rounded-card border-hairline border-muted bg-background p-3 text-base font-sans text-foreground"
                    textAlignVertical="top"
                  />
                  <Text
                    variant="caption"
                    tone="secondary"
                    className="self-end"
                  >
                    {t('trips.admin.release.dialog.notesCounter', {
                      count: notes.length,
                    })}
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
                    label={t('trips.admin.release.dialog.confirm')}
                    variant="primary"
                    onPress={onConfirm}
                    loading={release.isPending}
                    disabled={release.isPending}
                  />
                  <Button
                    label={t('common.cancel')}
                    variant="ghost"
                    onPress={resetAndClose}
                    disabled={release.isPending}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        open={confirmAnywayOpen}
        destructive
        title={t('trips.admin.release.confirmAnyway.title')}
        description={t('trips.admin.release.confirmAnyway.body')}
        confirmLabel={t('trips.admin.release.confirmAnyway.confirm')}
        cancelLabel={t('common.cancel')}
        confirmLoading={release.isPending}
        onConfirm={() => {
          setConfirmAnywayOpen(false)
          void doRelease()
        }}
        onCancel={() => setConfirmAnywayOpen(false)}
      />
    </>
  )
}
