import { describe, expect, it } from 'vitest'
import { creativeStructures, underwrite } from './underwriting'
import { transitionLifecycle } from './dealLifecycle'
import { matchLenders } from './serverModules'
import { complianceGate, generateOfferPacket, lenderBinder } from './release2'

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

describe('RE-OS Release 2 foundations', () => {
  it('blocks outbound communication without DNC and consent checks', () => {
    expect(complianceGate({state:'IL',channel:'VOICE',dncScrubbed:false,litigatorScrubbed:true,consentVerified:false}).approved).toBe(false)
  })

  it('generates offers only as pending human approval packets', () => {
    const packet = generateOfferPacket({dealId:'deal-1',contractType:'PSA',offerAmount:300000,closingDate:'2026-12-15',state:'IL'})
    expect(packet.status).toBe('PENDING_APPROVAL')
    expect(packet.requiresHumanApproval).toBe(true)
  })

  it('creates a complete lender binder review manifest', () => {
    const binder = lenderBinder({id:'deal-1'})
    expect(binder.sections).toContain('Underwriting pro forma')
  })
})
