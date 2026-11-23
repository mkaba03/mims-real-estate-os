export const pricingTiers = {
  STARTER:{monthly:99,annualMonthly:79.20,seats:1,underwriting:50,skipTraces:100,vision:15,rfqs:2,esign:3,voiceMinutes:0,pmUnits:5,mcp:'READ_ONLY'},
  PRO:{monthly:249,annualMonthly:199.20,seats:3,underwriting:250,skipTraces:500,vision:75,rfqs:10,esign:15,voiceMinutes:60,pmUnits:25,mcp:'READ_WRITE'},
  SCALE:{monthly:599,annualMonthly:479.20,seats:10,underwriting:1000,skipTraces:1500,vision:250,rfqs:35,esign:50,voiceMinutes:200,pmUnits:100,mcp:'FULL_WEBHOOKS'},
  ENTERPRISE:{monthly:1999,annualMonthly:1599.20,seats:-1,underwriting:4000,skipTraces:5000,vision:800,rfqs:120,esign:150,voiceMinutes:600,pmUnits:400,mcp:'DEDICATED_SLA'},
} as const

export function consumeCredit(balance:number, cost:number) {
  if(cost<0)return{ok:false,balance,error:'Invalid credit cost'}
  if(balance<cost)return{ok:false,balance,error:'Insufficient credits'}
  return{ok:true,balance:balance-cost}
}

export function meterOverage(action:'SKIP_TRACE'|'VOICE_MINUTE'|'ESIGN'|'VISION'|'RFQ') {
  const costs={SKIP_TRACE:.15,VOICE_MINUTE:.25,ESIGN:1.25,VISION:.35,RFQ:.50}
  return{action,overagePrice:costs[action]}
}
