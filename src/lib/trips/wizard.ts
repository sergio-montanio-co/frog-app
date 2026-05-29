import { z } from 'zod'

import type {
  CreateTripBody,
  TripMember,
} from '@/lib/api/queries'

import type { CostCategory } from '@/components/molecules'

export type Step = 1 | 2 | 3 | 4 | 5

export type CostBreakdownDraftItem = {
  category: CostCategory
  amount: string
  notes?: string
}

export type DraftMember = {
  name: string
  contact: string
}

export type DraftAccount = {
  holderName: string
  clabe: string
  bank: string
  instructions?: string
}

export type DraftTrip = {
  name: string
  destination: string
  destinationCountry?: string
  destinationCity?: string
  description?: string
  isSolo: boolean
  purchaseDeadline: string
  tripStartDate?: string
  tripEndDate?: string
  estimatedCostPerPerson: string
  costBreakdown: CostBreakdownDraftItem[]
  enableViaticos: boolean
  viaticosTargetPerPerson?: string
  members: DraftMember[]
  skipAccount: boolean
  account: DraftAccount
}

export const MIN_DEADLINE_DAYS = 7
export const MAX_DEADLINE_DAYS = 365
export const MAX_MEMBERS = 20
export const MAX_COST = 999999.99

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_RE = /^\+?[\d\s\-()]{4,32}$/
export const CLABE_RE = /^\d{18}$/

export function emptyDraft(): DraftTrip {
  return {
    name: '',
    destination: '',
    destinationCountry: undefined,
    destinationCity: undefined,
    description: undefined,
    isSolo: false,
    purchaseDeadline: '',
    tripStartDate: undefined,
    tripEndDate: undefined,
    estimatedCostPerPerson: '',
    costBreakdown: [],
    enableViaticos: false,
    viaticosTargetPerPerson: undefined,
    members: [],
    skipAccount: false,
    account: {
      holderName: '',
      clabe: '',
      bank: '',
      instructions: undefined,
    },
  }
}

export function nextStep(current: Step, draft: DraftTrip): Step {
  if (current === 3 && draft.isSolo) return 5
  return Math.min(5, current + 1) as Step
}

export function prevStep(current: Step, draft: DraftTrip): Step {
  if (current === 5 && draft.isSolo) return 3
  return Math.max(1, current - 1) as Step
}

export function totalDots(draft: DraftTrip): number {
  return draft.isSolo ? 4 : 5
}

export function displayedStep(current: Step, draft: DraftTrip): number {
  if (draft.isSolo && current === 5) return 4
  return current
}

function startOfDayUtc(d: Date): Date {
  const clone = new Date(d)
  clone.setUTCHours(0, 0, 0, 0)
  return clone
}

function diffInDays(from: Date, to: Date): number {
  const ms = startOfDayUtc(to).getTime() - startOfDayUtc(from).getTime()
  return Math.round(ms / 86_400_000)
}

export function detectContactKind(
  raw: string,
): 'email' | 'phone' | 'unknown' {
  const trimmed = raw.trim()
  if (!trimmed) return 'unknown'
  if (trimmed.includes('@')) return EMAIL_RE.test(trimmed) ? 'email' : 'unknown'
  if (PHONE_RE.test(trimmed)) return 'phone'
  return 'unknown'
}

const step1Schema = z.object({
  name: z.string().trim().min(2).max(100),
  destination: z.string().trim().min(1).max(200),
  destinationCountry: z
    .string()
    .trim()
    .length(2)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  destinationCity: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  isSolo: z.boolean(),
})

const stepCostSchema = z
  .object({
    estimatedCostPerPerson: z
      .string()
      .refine((v) => {
        const n = Number(v)
        return Number.isFinite(n) && n > 0
      }, 'cost_invalid')
      .refine((v) => Number(v) <= MAX_COST, 'cost_too_high'),
    enableViaticos: z.boolean(),
    viaticosTargetPerPerson: z.string().optional(),
  })
  .refine(
    ({ enableViaticos, viaticosTargetPerPerson }) => {
      if (!enableViaticos) return true
      if (!viaticosTargetPerPerson) return false
      const n = Number(viaticosTargetPerPerson)
      return Number.isFinite(n) && n > 0 && n <= MAX_COST
    },
    {
      message: 'viaticos_required',
      path: ['viaticosTargetPerPerson'],
    },
  )

const stepDatesSchema = z
  .object({
    purchaseDeadline: z.string().trim().min(1),
    tripStartDate: z.string().trim().optional(),
    tripEndDate: z.string().trim().optional(),
    enableViaticos: z.boolean(),
  })
  .refine(
    ({ purchaseDeadline }) => {
      const days = diffInDays(new Date(), new Date(purchaseDeadline))
      return days >= MIN_DEADLINE_DAYS && days <= MAX_DEADLINE_DAYS
    },
    {
      message: 'deadline_out_of_range',
      path: ['purchaseDeadline'],
    },
  )
  .refine(
    ({ enableViaticos, tripStartDate }) =>
      !enableViaticos || Boolean(tripStartDate),
    {
      message: 'trip_start_required_for_viaticos',
      path: ['tripStartDate'],
    },
  )
  .refine(
    ({ tripStartDate, purchaseDeadline }) =>
      !tripStartDate ||
      new Date(tripStartDate).getTime() > new Date(purchaseDeadline).getTime(),
    {
      message: 'trip_start_before_deadline',
      path: ['tripStartDate'],
    },
  )
  .refine(
    ({ tripStartDate, tripEndDate }) =>
      !tripStartDate ||
      !tripEndDate ||
      new Date(tripEndDate).getTime() > new Date(tripStartDate).getTime(),
    {
      message: 'trip_end_before_start',
      path: ['tripEndDate'],
    },
  )

const memberDraftSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    contact: z.string().trim().min(1),
  })
  .refine(
    ({ contact }) => detectContactKind(contact) !== 'unknown',
    { message: 'contact_invalid', path: ['contact'] },
  )

const step4Schema = z
  .object({
    isSolo: z.boolean(),
    members: z.array(memberDraftSchema).min(1).max(MAX_MEMBERS),
  })
  .refine(
    ({ members }) => {
      const emails = members
        .map((m) => m.contact.trim().toLowerCase())
        .filter((c) => detectContactKind(c) === 'email')
      return new Set(emails).size === emails.length
    },
    { message: 'duplicate_email', path: ['members'] },
  )
  .refine(
    ({ members }) => {
      const phones = members
        .map((m) => m.contact.replace(/\s+/g, ''))
        .filter((c) => detectContactKind(c) === 'phone')
      return new Set(phones).size === phones.length
    },
    { message: 'duplicate_phone', path: ['members'] },
  )

const step5Schema = z.object({
  skipAccount: z.boolean(),
  account: z.object({
    holderName: z.string().trim().max(100),
    clabe: z.string().trim(),
    bank: z.string().trim().max(60),
    instructions: z.string().trim().max(500).optional(),
  }),
})
  .refine(
    ({ skipAccount, account }) =>
      skipAccount || account.holderName.length >= 1,
    { message: 'holder_required', path: ['account', 'holderName'] },
  )
  .refine(
    ({ skipAccount, account }) =>
      skipAccount || CLABE_RE.test(account.clabe),
    { message: 'clabe_invalid', path: ['account', 'clabe'] },
  )
  .refine(
    ({ skipAccount, account }) =>
      skipAccount || account.bank.length >= 1,
    { message: 'bank_required', path: ['account', 'bank'] },
  )

export type StepValidation =
  | { success: true }
  | { success: false; issues: Record<string, string> }

function issuesFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!(path in out)) out[path] = issue.message
  }
  return out
}

export function validateStep(step: Step, draft: DraftTrip): StepValidation {
  if (step === 1) {
    const r = step1Schema.safeParse({
      name: draft.name,
      destination: draft.destination,
      destinationCountry: draft.destinationCountry ?? '',
      destinationCity: draft.destinationCity ?? '',
      description: draft.description ?? '',
      isSolo: draft.isSolo,
    })
    return r.success
      ? { success: true }
      : { success: false, issues: issuesFrom(r.error) }
  }
  if (step === 2) {
    const r = stepCostSchema.safeParse({
      estimatedCostPerPerson: draft.estimatedCostPerPerson,
      enableViaticos: draft.enableViaticos,
      viaticosTargetPerPerson: draft.viaticosTargetPerPerson,
    })
    return r.success
      ? { success: true }
      : { success: false, issues: issuesFrom(r.error) }
  }
  if (step === 3) {
    const r = stepDatesSchema.safeParse({
      purchaseDeadline: draft.purchaseDeadline,
      tripStartDate: draft.tripStartDate ?? undefined,
      tripEndDate: draft.tripEndDate ?? undefined,
      enableViaticos: draft.enableViaticos,
    })
    return r.success
      ? { success: true }
      : { success: false, issues: issuesFrom(r.error) }
  }
  if (step === 4) {
    if (draft.isSolo) return { success: true }
    const r = step4Schema.safeParse({
      isSolo: draft.isSolo,
      members: draft.members,
    })
    return r.success
      ? { success: true }
      : { success: false, issues: issuesFrom(r.error) }
  }
  if (step === 5) {
    const prior = (
      [1, 2, 3, draft.isSolo ? null : 4].filter((s) => s !== null) as Step[]
    ).every((s) => validateStep(s, draft).success)
    if (!prior) return { success: false, issues: { prior: 'previous_invalid' } }
    const r = step5Schema.safeParse({
      skipAccount: draft.skipAccount,
      account: draft.account,
    })
    return r.success
      ? { success: true }
      : { success: false, issues: issuesFrom(r.error) }
  }
  return { success: true }
}

export function isStepValid(step: Step, draft: DraftTrip): boolean {
  return validateStep(step, draft).success
}

function normalizeAmount(value: string): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0.00'
  return n.toFixed(2)
}

export function buildPayloadFromDraft(draft: DraftTrip): CreateTripBody {
  const members: CreateTripBody['members'] = draft.isSolo
    ? []
    : draft.members.map((m) => {
        const kind = detectContactKind(m.contact)
        const trimmed = m.contact.trim()
        return {
          name: m.name.trim(),
          email:
            kind === 'email' ? trimmed.toLowerCase() : undefined,
          phone:
            kind === 'phone' ? trimmed.replace(/\s+/g, '') : undefined,
        }
      })

  const costBreakdown =
    draft.costBreakdown.length > 0
      ? draft.costBreakdown.map((c) => ({
          category: c.category,
          amount: normalizeAmount(c.amount),
          notes: c.notes?.trim() ? c.notes.trim() : undefined,
        }))
      : undefined

  const responsibleAccountInfo =
    !draft.skipAccount && draft.account.holderName && draft.account.clabe
      ? {
          holderName: draft.account.holderName.trim(),
          clabe: draft.account.clabe.trim(),
          bank: draft.account.bank.trim(),
          instructions: draft.account.instructions?.trim()
            ? draft.account.instructions.trim()
            : undefined,
        }
      : undefined

  return {
    name: draft.name.trim(),
    destination: draft.destination.trim(),
    destinationCountry: draft.destinationCountry?.trim() || undefined,
    destinationCity: draft.destinationCity?.trim() || undefined,
    description: draft.description?.trim() || undefined,
    isSolo: draft.isSolo,
    tripStartDate: draft.tripStartDate || undefined,
    tripEndDate: draft.tripEndDate || undefined,
    purchaseDeadline: draft.purchaseDeadline,
    estimatedCostPerPerson: normalizeAmount(draft.estimatedCostPerPerson),
    currency: 'MXN',
    costBreakdown,
    enableViaticos: draft.enableViaticos,
    viaticosTargetPerPerson:
      draft.enableViaticos && draft.viaticosTargetPerPerson
        ? normalizeAmount(draft.viaticosTargetPerPerson)
        : undefined,
    responsibleAccountInfo,
    members,
  }
}

export function pickInvitations(members: TripMember[]) {
  return members
    .filter((m) => m.invitation != null)
    .map((m) => ({
      memberId: m.id,
      name: m.invitedName ?? m.user?.displayName ?? '',
      email: m.invitedEmail,
      phone: m.invitedPhone,
      shareUrl: m.invitation!.shareUrl,
      expiresAt: m.invitation!.expiresAt,
    }))
}

export const COMMON_BANKS = [
  'BBVA',
  'Santander',
  'Banorte',
  'HSBC',
  'Citibanamex',
  'Scotiabank',
  'Banco Azteca',
  'Banregio',
  'Inbursa',
  'Banco del Bajío',
] as const
