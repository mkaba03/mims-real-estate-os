import { describe,it,expect } from 'vitest'
import { underwrite,strategyMatrix } from './underwriting'

describe('deterministic UI underwriting',()=>{
 it('matches net profit and MAO formulas',()=>{
  const result=underwrite({purchasePrice:300000,arv:450000,rehab:70000,monthlyRent:2500,annualTaxes:6000,annualInsurance:3000,monthlyHoa:0,annualDebtService:30000})
  expect(result.flip.netProfit).toBe(80000)
  expect(result.flip.mao).toBe(245000)
  expect(result.rental.annualNoi).toBe(21000)
  expect(result.rental.dscr).toBe(0.7)
 })
 it('creates a complete six-strategy matrix',()=>{
  const matrix=strategyMatrix({purchasePrice:300000,arv:450000,rehab:70000,monthlyRent:2500})
  expect(matrix).toHaveLength(6)
  expect(matrix.map(row=>row.strategy)).toContain('Land Split')
 })
})
