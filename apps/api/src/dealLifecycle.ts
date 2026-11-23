export const lifecycleStages = ['SOURCED','UNDERWRITTEN','OFFER_SENT','UNDER_CONTRACT','DILIGENCE','CLOSING','CLOSED','REHAB','STABILIZED','SOLD'] as const
export type LifecycleStage = typeof lifecycleStages[number]

export function transitionLifecycle(current: LifecycleStage, next: LifecycleStage) {
  const allowed: Record<LifecycleStage, LifecycleStage[]> = {
    SOURCED:['UNDERWRITTEN'], UNDERWRITTEN:['OFFER_SENT'], OFFER_SENT:['UNDER_CONTRACT','UNDERWRITTEN'],
    UNDER_CONTRACT:['DILIGENCE'], DILIGENCE:['CLOSING'], CLOSING:['CLOSED'], CLOSED:['REHAB','STABILIZED','SOLD'],
    REHAB:['STABILIZED','SOLD'], STABILIZED:['SOLD'], SOLD:[],
  }
  if (!allowed[current].includes(next)) return { ok:false, error:`Invalid transition ${current} -> ${next}` }
  return { ok:true, stage:next }
}

export function auditEvent(dealId:string, previousStage:string, nextStage:string, actor:string) {
  return { id:crypto.randomUUID(), dealId, previousStage, nextStage, actor, timestamp:new Date().toISOString() }
}
