import { describe, expect, it } from 'vitest'
import { creativeStructures, underwrite } from './underwriting'
import { transitionLifecycle } from './dealLifecycle'
import { matchLenders } from './serverModules'

describe('RE-OS module foundations', () => {
  it('calculates deterministic rental and flip outputs', () => {
    const result = underwrite({ purchasePrice:300000, arv:450000, rehabCost:70000, monthlyRent:2500 })
    expect(result.flip.netProfit).toBe(80000)
    expect(result.rental.capRate).toBe(0.1)
  })

  it('returns creative finance options with explicit risk review', () => {
    const options = creativeStructures({ purchasePrice:300000, arv:450000, rehabCost:70000, monthlyRent:2500, existingLoanBalance:250000 })
    expect(options.map(option => option.strategy)).toContain('SUB_TO')
    expect(options.every(option => option.risk.length > 0)).toBe(true)
  })

  it('allows valid lifecycle transitions and rejects invalid ones', () => {
    expect(transitionLifecycle('SOURCED','UNDERWRITTEN').ok).toBe(true)
    expect(transitionLifecycle('SOURCED','CLOSED').ok).toBe(false)
  })

  it('matches lender programs against property type, LTV, and DSCR', () => {
    expect(matchLenders('Multifamily', 0.70, 1.30).some(lender => lender.type === 'AGENCY')).toBe(true)
  })
})
