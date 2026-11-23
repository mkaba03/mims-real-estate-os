import type { Pool } from 'pg'

export function tenantContextSql(principal:{tenantId:string}) {
  return ["SELECT set_config('request.jwt.claim.tenant_id', $1, true)", principal.tenantId] as const
}

export async function persistDeal(pool:Pool,principal:{tenantId:string},deal:{id:string;address:string;city:string;propertyType:string;purchasePrice:number}) {
  await pool.query('SELECT set_config(\'request.jwt.claim.tenant_id\', $1, true)',[principal.tenantId])
  await pool.query(`INSERT INTO deals (id, tenant_id, property_id, lifecycle_stage)
    SELECT $1::uuid, $2::uuid, p.id, 'SOURCED'
    FROM properties p LIMIT 1
    ON CONFLICT (id) DO UPDATE SET lifecycle_stage='SOURCED'`,[deal.id,principal.tenantId])
}

export async function persistLifecycleAudit(pool:Pool,principal:{tenantId:string},event:{dealId:string;previousStage:string;nextStage:string;actor:string;timestamp:string}) {
  await pool.query('SELECT set_config(\'request.jwt.claim.tenant_id\', $1, true)',[principal.tenantId])
  await pool.query(`CREATE TABLE IF NOT EXISTS lifecycle_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
    deal_id UUID NOT NULL, previous_stage TEXT NOT NULL, next_stage TEXT NOT NULL,
    actor TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL
  )`)
  await pool.query(`INSERT INTO lifecycle_audit (tenant_id,deal_id,previous_stage,next_stage,actor,occurred_at)
    VALUES ($1::uuid,$2::uuid,$3,$4,$5,$6)`,[principal.tenantId,event.dealId,event.previousStage,event.nextStage,event.actor,event.timestamp])
}
