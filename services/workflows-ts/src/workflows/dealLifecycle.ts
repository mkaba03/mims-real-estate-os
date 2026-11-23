import { condition, defineQuery, defineSignal, proxyActivities, setHandler, sleep } from '@temporalio/workflow'

export type DealStage = 'SOURCED'|'UNDERWRITTEN'|'OFFER_SENT'|'UNDER_CONTRACT'|'DILIGENCE'|'CLOSING'|'CLOSED'|'REHAB'|'STABILIZED'|'SOLD'

export interface DealLifecycleInput {
  dealId:string
  tenantId:string
  purchasePrice:number
  state:string
}

export const advanceStage = defineSignal<[stage:DealStage]>('advanceStage')
export const humanApprove = defineSignal<[approvedBy:string, envelopeId:string]>('humanApprove')
export const getLifecycleState = defineQuery<{stage:DealStage; approvedBy:string|null; audit:Array<Record<string,string>>}>('getLifecycleState')

const activities = proxyActivities<{
  persistStage(input:{dealId:string;tenantId:string;stage:DealStage}):Promise<void>
  sendOfferForHumanApproval(input:{dealId:string;tenantId:string;purchasePrice:number;state:string}):Promise<{envelopeId:string}>
  generateLenderBinder(input:{dealId:string;tenantId:string}):Promise<void>
  launchDiligence(input:{dealId:string;tenantId:string}):Promise<void>
}>({ startToCloseTimeout:'1 minute', retry:{maximumAttempts:3} })

export async function dealLifecycleWorkflow(input:DealLifecycleInput) {
  let stage:DealStage='SOURCED'
  let approvedBy:string|null=null
  const audit:Array<Record<string,string>>=[]

  setHandler(getLifecycleState, () => ({stage,approvedBy,audit}))
  setHandler(advanceStage, async next => {
    const previous=stage
    stage=next
    audit.push({from:previous,to:next,at:new Date().toISOString()})
    await activities.persistStage({dealId:input.dealId,tenantId:input.tenantId,stage:next})
  })

  setHandler(humanApprove, async (actor,envelopeId) => {
    approvedBy=actor
    audit.push({event:'HUMAN_APPROVAL',actor,envelopeId,at:new Date().toISOString()})
  })

  await activities.persistStage({dealId:input.dealId,tenantId:input.tenantId,stage:'SOURCED'})

  await condition(() => stage==='UNDERWRITTEN', 90*24*60*60*1000)
  await activities.persistStage({dealId:input.dealId,tenantId:input.tenantId,stage:'UNDERWRITTEN'})

  await condition(() => stage==='OFFER_SENT', 30*24*60*60*1000)
  await activities.sendOfferForHumanApproval(input)

  await condition(() => approvedBy!==null, 14*24*60*60*1000)
  await activities.persistStage({dealId:input.dealId,tenantId:input.tenantId,stage:'UNDER_CONTRACT'})
  stage='UNDER_CONTRACT'

  await activities.generateLenderBinder(input)
  await activities.launchDiligence(input)

  await condition(() => stage==='CLOSED', 180*24*60*60*1000)
  await activities.persistStage({dealId:input.dealId,tenantId:input.tenantId,stage:'CLOSED'})

  await sleep(1)
  return {dealId:input.dealId,finalStage:stage,audit}
}
