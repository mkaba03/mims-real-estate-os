export type UnderwritingInput={purchasePrice:number;arv:number;rehab:number;monthlyRent:number;annualTaxes?:number;annualInsurance?:number;monthlyHoa?:number;annualDebtService?:number}

export function round(value:number,places=2){return Number(value.toFixed(places))}

export function underwrite(input:UnderwritingInput){
 const purchaseTotal=input.purchasePrice+input.rehab
 const annualNoi=input.monthlyRent*12-(input.annualTaxes||0)-(input.annualInsurance||0)-(input.monthlyHoa||0)*12
 const flipProfit=input.arv-purchaseTotal
 const cashOnCash=purchaseTotal?flipProfit/purchaseTotal:0
 const capRate=input.purchasePrice?annualNoi/input.purchasePrice:0
 const dscr=input.annualDebtService?annualNoi/input.annualDebtService:0
 const mao=input.arv*.70-input.rehab
 return {
  engineVersion:'1.0.0',
  flip:{netProfit:round(flipProfit),mao:round(mao),rank:flipProfit>0?1:0},
  rental:{annualNoi:round(annualNoi),cashOnCash:round(cashOnCash,4),capRate:round(capRate,4),dscr:round(dscr,4)},
 }
}

export const strategies=['Fix & Flip','BRRRR','Long-Term Rental','Short-Term Rental','Value-Add Syndication','Land Split'] as const

export function strategyMatrix(deal:{purchasePrice:number;arv:number;rehab:number;monthlyRent:number}){
 const base=underwrite(deal)
 return strategies.map((strategy,index)=>({
  strategy,
  arv:deal.arv,
  rehab:deal.rehab*(index===4?1.7:index===5?.5:1),
  netProfit:index===0?base.flip.netProfit:index===5?deal.arv-deal.purchasePrice-deal.rehab*.5:round(deal.monthlyRent*12*.16),
  cashOnCash:index===0?0:base.rental.cashOnCash*(.85+index*.12),
  irr:round([21.4,18.2,9.1,14.8,24.6,38.2][index]),
  dscr:index===0?null:base.rental.dscr,
  mao:base.flip.mao,
 }))
}
