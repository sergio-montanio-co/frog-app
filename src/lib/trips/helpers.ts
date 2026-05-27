import type {
  MemberCuotaStatus,
  PaymentSchedule,
  ResponsibleAccount,
  TripDto,
  TripMember,
  TripSavingsPlan,
} from '@/lib/api/queries'

export function findActivePurchasePlan(
  trip: TripDto,
): TripSavingsPlan | null {
  return (
    trip.savingsPlans.find(
      (p) => p.type === 'trip_purchase' && p.status === 'active',
    ) ?? null
  )
}

export function resolveMemberName(member: TripMember): string {
  return (
    member.user?.displayName?.trim() ||
    member.invitedName?.trim() ||
    member.invitedEmail?.trim() ||
    member.invitedPhone?.trim() ||
    ''
  )
}

export function isOrganizer(trip: TripDto, userId: string): boolean {
  return trip.members.some(
    (m) =>
      m.role === 'organizer' &&
      m.status === 'active' &&
      m.user?.id === userId,
  )
}

export function daysUntil(iso: string): number {
  const target = new Date(iso).getTime()
  const now = Date.now()
  return Math.ceil((target - now) / 86_400_000)
}

export type MemberStateResult = {
  schedule: PaymentSchedule
  status: MemberCuotaStatus
}

export function getMemberCurrentState(
  memberId: string,
  schedules: PaymentSchedule[],
): MemberStateResult | null {
  for (const s of schedules) {
    const my = s.derivedStatus.perMember.find((p) => p.memberId === memberId)
    if (!my) continue
    if (my.state !== 'paid') return { schedule: s, status: my }
  }
  const last = schedules[schedules.length - 1]
  if (!last) return null
  const lastMine = last.derivedStatus.perMember.find(
    (p) => p.memberId === memberId,
  )
  return lastMine ? { schedule: last, status: lastMine } : null
}

export function todayIsoStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function getResponsibleAccount(
  trip: TripDto,
): ResponsibleAccount | null {
  const raw = trip.responsibleAccountInfo
  if (!raw || typeof raw !== 'object') return null
  const holderName = typeof raw.holderName === 'string' ? raw.holderName : ''
  const clabe = typeof raw.clabe === 'string' ? raw.clabe : ''
  const bank = typeof raw.bank === 'string' ? raw.bank : ''
  if (!holderName || !clabe || !bank) return null
  const instructions =
    typeof raw.instructions === 'string' ? raw.instructions : undefined
  return { holderName, clabe, bank, instructions }
}
