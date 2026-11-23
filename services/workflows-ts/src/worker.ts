import { NativeConnection, Worker } from '@temporalio/worker'
import * as activities from './activities/dealActivities'

async function run() {
  const connection = await NativeConnection.connect({address:process.env.TEMPORAL_ADDRESS||'127.0.0.1:7233'})
  const worker = await Worker.create({
    connection,
    namespace:process.env.TEMPORAL_NAMESPACE||'default',
    taskQueue:'reos-deal-lifecycle',
    workflowsPath:require.resolve('./workflows/dealLifecycle'),
    activities,
  })
  await worker.run()
}

run().catch(error=>{console.error(error);process.exit(1)})
