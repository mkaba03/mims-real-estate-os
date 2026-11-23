export type UnderwritingInput = {
  purchasePrice:number; arv:number; rehabCost:number; monthlyRent:number;
  annualTaxes?:number; annualInsurance?:number; monthlyHoa?:number; annualDebtService?:number;
}

export function underwrite(input:UnderwritingInput) {
  const purchaseTotal = input.purchasePrice + input.rehabCost
  const flipProfit = input.arv - purchaseTotal
  const annualNoi = input.monthlyRent * 12 - (input.annualTaxes || 0) - (input.annualInsurance || 0) - ((input.monthlyHoa || 0)*12)
  const cashOnCash = purchaseTotal ? flipProfit/purchaseTotal : 0
  const capRate = input.purchasePrice ? annualNoi/input.purchasePrice : 0
  const dscr = input.annualDebtService ? annualNoi/input.annualDebtService : 0
  const mao = input.arv * 0.70 - input.rehabCost
  return {
    engineVersion:'1.0.0', flip:{netProfit:round(flipProfit), mao:round(mao), rank:flipProfit>0?1:0},
    rental:{annualNoi:round(annualNoi), cashOnCash:round(cashOnCash,4), capRate:round(capRate,4), dscr:round(dscr,4)},
  }
}

export function creativeStructures(input:UnderwritingInput & {existingLoanBalance?:number; existingRate?:number}) {
  const existingBalance = input.existingLoanBalance || 0
  const downPayment = Math.max(input.purchasePrice-existingBalance,0)
  return [
    {strategy:'SUB_TO', purchaseCashNeeded:downPayment*0.05, risk:'Due-on-sale and lender compliance review required', eligible:existingBalance>0},
    {strategy:'SELLER_FINANCE', purchaseCashNeeded:Math.min(input.purchasePrice*0.05,50000), risk:'State usury and documentation review required', eligible:existingBalance>=0},
    {strategy:'WRAP', purchaseCashNeeded:downPayment*0.10, risk:'Junior lien, disclosure, and due-on-sale review required', eligible:existingBalance>0},
    {strategy:'NOVATION', purchaseCashNeeded:0, risk:'Disclosures and licensed real estate professional review required', eligible:input.arv>input.purchasePrice},
    {strategy:'LEASE_OPTION', purchaseCashNeeded:Math.min(input.purchasePrice*0.03,30000), risk:'Lease/option and local landlord-tenant law review required', eligible:true},
  ].filter(x=>x.eligible)
}

function round(value:number, places=2) { return Number(value.toFixed(places)) }
