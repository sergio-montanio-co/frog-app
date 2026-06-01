import {
  validateClabe as libValidateClabe,
  getBankName as libGetBankName,
} from 'clabe-js'

export function validateClabe(clabe: string): boolean {
  if (typeof clabe !== 'string') return false
  const normalized = clabe.replace(/\D/g, '')
  if (normalized.length !== 18) return false
  return libValidateClabe(normalized)
}

export function resolveBankFromClabe(clabe: string): string | null {
  if (typeof clabe !== 'string') return null
  const normalized = clabe.replace(/\D/g, '')
  if (normalized.length !== 18) return null
  if (!libValidateClabe(normalized)) return null
  return libGetBankName(normalized) ?? null
}

export type ClabeState =
  | { kind: 'empty' }
  | { kind: 'partial'; digits: number }
  | { kind: 'invalid' }
  | { kind: 'resolved'; bank: string }
  | { kind: 'unknownBank' }

export function clabeState(clabe: string): ClabeState {
  if (typeof clabe !== 'string') return { kind: 'empty' }
  const normalized = clabe.replace(/\D/g, '')
  if (normalized.length === 0) return { kind: 'empty' }
  if (normalized.length < 18) return { kind: 'partial', digits: normalized.length }
  if (!libValidateClabe(normalized)) return { kind: 'invalid' }
  const bank = libGetBankName(normalized)
  return bank ? { kind: 'resolved', bank } : { kind: 'unknownBank' }
}
