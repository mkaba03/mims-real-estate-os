import crypto from 'node:crypto'

export type ComplianceContext = {
  state: string
  channel: 'VOICE' | 'SMS' | 'EMAIL' | 'DIRECT_MAIL'
  dncScrubbed: boolean
  litigatorScrubbed: boolean
  consentVerified: boolean
}

export function complianceGate(context: {
  state:string; channel:'VOICE'|'SMS'|'EMAIL'|'DIRECT_MAIL'; dncScrubbed:boolean; litigatorScrubbed:boolean; consentVerified:boolean
}) {
  const reasons:string[] = []
  if (!context.dncScrubbed) reasons.push('DNC scrub required')
  if (!context.litigatorScrubbed) reasons.push('Litigator scrape required')
  if (context.channel !== 'EMAIL' && context.channel !== 'DIRECT_MAIL' && !context.consentVerified) reasons.push('Prior consent required')
  return { approved: reasons.length===0, reasons, policyVersion:'TCPA-DNC-2026.1' }
}

export function generateOfferPacket(input: {
  dealId:string; contractType:'PSA'|'LOI'|'SUB_TO_ADDENDUM'|'NOVATION'; offerAmount:number; closingDate:string; state:string
}) {
  return {
    envelopeId:`env_${crypto.randomUUID().slice(0,8)}`,
    status:'PENDING_APPROVAL',
    contractType:input.contractType,
    offerAmount:input.offerAmount,
    closingDate:input.closingDate,
    state:input.state,
    requiresHumanApproval:true,
    generatedAt:new Date().toISOString(),
  }
}

export function lenderBinder(deal:any) {
  return {
    dealId:deal.id,
    sections:['Executed PSA','Underwriting pro forma','PostGIS comps','Rehab scope','Entity documents','Financial verification'],
    status:'READY_FOR_REVIEW',
  }
}
