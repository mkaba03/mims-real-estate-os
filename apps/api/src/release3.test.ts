import { describe, expect, it } from 'vitest'
import { normalizeBid, auditTitleCommitment, auditSettlement, createClosingChecklist } from './release3'

describe('Release 3 diligence and closing foundations', () => {
  it('normalizes bid totals against a rehab baseline', () => {
    const result = normalizeBid([{item:'Roof',quantity:1,unitCost:12000},{item:'HVAC',quantity:1,unitCost:8000}], [{item:'Roof',quantity:1,unitCost:10000},{item:'HVAC',quantity:1,unitCost:7000}])
    expect(result.bidTotal).toBe(20000)
    expect(result.variance).toBe(3000)
  })

  it('flags unresolved title issues', () => {
    expect(auditTitleCommitment({mortgages:1,municipalLiens:0,easements:1,taxCertificates:0}).clearToClose).toBe(false)
  })

  it('requires settlement review for a material variance', () => {
    expect(auditSettlement([{description:'Title fee',amount:2500}],[{description:'Title fee',amount:1000}]).requiresReview).toBe(true)
  })

  it('creates a complete closing checklist', () => {
    expect(createClosingChecklist('deal-1').tasks).toContain('Wire verification')
  })
})
