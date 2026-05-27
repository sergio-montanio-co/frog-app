import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Avatar, Badge, Icon, IconButton, Text } from '@/components/atoms'
import type { BadgeTone } from '@/components/atoms'
import { colors } from '@/theme/colors'
import { cn } from '@/lib/cn'
import { resolveMemberName } from '@/lib/trips/helpers'
import type { MemberCuotaStatus, TripMember } from '@/lib/api/queries'

export type MemberStatusRowProps = {
  member: TripMember
  status: MemberCuotaStatus | null
  isCurrentUser?: boolean
  onRemove?: () => void
  className?: string
}

type CuotaState = MemberCuotaStatus['state']

type StateMeta = {
  i18nKey: string
  tone: BadgeTone
  icon?: 'schedule' | 'check' | 'hourglass-empty'
}

const STATE_META: Record<CuotaState, StateMeta> = {
  paid: { i18nKey: 'trips.member.state.paid', tone: 'primary', icon: 'check' },
  partial: { i18nKey: 'trips.member.state.partial', tone: 'neutral' },
  reported: {
    i18nKey: 'trips.member.state.reported',
    tone: 'subtle',
    icon: 'hourglass-empty',
  },
  late: {
    i18nKey: 'trips.member.state.late',
    tone: 'subtle',
    icon: 'schedule',
  },
  pending: { i18nKey: 'trips.member.state.pending', tone: 'subtle' },
}

export function MemberStatusRow({
  member,
  status,
  isCurrentUser,
  onRemove,
  className,
}: MemberStatusRowProps) {
  const { t } = useTranslation()
  const isInvited = member.status === 'invited'
  const baseName = resolveMemberName(member)
  const display = isCurrentUser
    ? t('trips.dashboard.members.youPrefix', { name: baseName })
    : baseName

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 py-2',
        isCurrentUser &&
          'rounded-card border-hairline border-muted bg-muted/10 px-3',
        className,
      )}
    >
      <Avatar
        name={baseName}
        size={40}
        className={cn(isInvited && 'opacity-60')}
      />
      <View className="flex-1 gap-0.5">
        <Text variant="body-em" numberOfLines={1}>
          {display || '—'}
        </Text>
        {isInvited ? (
          <Text variant="caption" tone="secondary">
            {member.invitedEmail ?? member.invitedPhone ?? ''}
          </Text>
        ) : null}
      </View>
      {isInvited ? (
        <Badge label={t('trips.member.pendingAcceptance')} tone="subtle" />
      ) : status ? (
        <Badge label={t(STATE_META[status.state].i18nKey)} tone={STATE_META[status.state].tone}>
          {STATE_META[status.state].icon ? (
            <Icon
              name={STATE_META[status.state].icon!}
              size={16}
              color={
                STATE_META[status.state].tone === 'primary'
                  ? colors.background
                  : colors.secondary
              }
            />
          ) : null}
        </Badge>
      ) : null}
      {onRemove ? (
        <IconButton
          name="more-vert"
          variant="ghost"
          accessibilityLabel={t('trips.admin.removeMember.cta')}
          onPress={onRemove}
        />
      ) : null}
    </View>
  )
}
