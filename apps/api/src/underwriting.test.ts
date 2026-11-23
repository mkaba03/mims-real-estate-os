import { describe, expect, it } from 'vitest'

function analyze(purchasePrice: number, arv: number, rehabCost: number, monthlyRent: number) {
  const netProfit = arv - purchasePrice - rehabCost
  const annualNoi = monthlyRent * 12
  return {
    netProfit,
    cashOnCash: purchasePrice ? netProfit / purchasePrice : 0,
    capRate: purchasePrice ? annualNoi / purchasePrice : 0,
  }
}

describe('deterministic underwriting', () => {
  it('calculates flip profit exactly', () => {
    expect(analyze(300000, 450000, 70000, 2500).netProfit).toBe(80000)
  })
  it('calculates cap rate', () => {
    expect(analyze(300000, 450000, 70000, 2500).capRate).toBeCloseTo(0.1)
  })
  it('rejects division by zero', () => {
    expect(analyze(0, 450000, 70000, 2500).cashOnCash).toBe(0)
  })
})
