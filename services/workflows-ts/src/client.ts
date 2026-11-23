import { Client, Connection } from '@temporalio/client'

export async function startDealLifecycle(dealId:string,tenantId:string,purchasePrice:number,state:string) {
  const connection=await Connection.connect({address:process.env.TEMPORAL_ADDRESS||'127.0.0.1:7233'})
  const client=new Client({connection})
  const handle=await client.workflow.start('dealLifecycleWorkflow',{taskQueue:'reos-deal-lifecycle',workflowId:`deal-${dealId}`,args:[{dealId,tenantId,purchasePrice,state}]})
  return {workflowId:handle.workflowId,runId:handle.firstExecutionRunId}
}
