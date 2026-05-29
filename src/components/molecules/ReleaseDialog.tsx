import { useState } from 'react'
import { Modal, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  Button,
  Card,
  ConfirmDialog,
  Icon,
  Input,
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
  viaticosNeedsTripStartDate?: boolean
  onClose: () => void
  onReviewPending?: () => void
  onEditTrip?: () => void
}

const NOTES_MAX = 1000

export function ReleaseDialog({
  open,
  tripId,
  tripName,
  planId,
  pendingCount,
  viaticosNeedsTripStartDate = false,
  onClose,
  onReviewPending,
  onEditTrip,
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

                {viaticosNeedsTripStartDate ? (
                  <Card className="gap-3 border-primary">
                    <View className="flex-row items-start gap-2">
                      <Icon name="warning" size={20} color={colors.primary} />
                      <View className="flex-1 gap-1">
                        <Text variant="body-em" tone="primary">
                          {t('trips.admin.release.viaticosWarning.title')}
                        </Text>
                        <Text variant="caption" tone="secondary">
                          {t('trips.admin.release.viaticosWarning.body')}
                        </Text>
                      </View>
                    </View>
                    {onEditTrip ? (
                      <Button
                        label={t(
                          'trips.admin.release.viaticosWarning.editTrip',
                        )}
                        variant="secondary"
                        onPress={() => {
                          resetAndClose()
                          onEditTrip()
                        }}
                      />
                    ) : null}
                  </Card>
                ) : null}

                <View className="gap-2">
                  <Input
                    label={t('trips.admin.release.dialog.notesLabel')}
                    value={notes}
                    onChangeText={(v) => {
                      setNotes(v)
                      setSubmitError(null)
                    }}
                    placeholder={t(
                      'trips.admin.release.dialog.notesPlaceholder',
                    )}
                    multiline
                    numberOfLines={3}
                    maxLength={NOTES_MAX}
                    accessibilityLabel={t(
                      'trips.admin.release.dialog.notesLabel',
                    )}
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
