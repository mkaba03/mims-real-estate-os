import { describe,it,expect } from 'vitest'
import { setIntegrationSecret,listIntegrationSecrets } from './integrationVault'

describe('integration configuration vault',()=>{
  it('stores credentials without returning raw secret text',()=>{
    const result=setIntegrationSecret('tenant-a','ANTHROPIC','secret-value-123','SANDBOX')
    expect(result.secretStored).toBe(true)
    expect(JSON.stringify(result)).not.toContain('secret-value-123')
  })
  it('lists integrations only for the tenant',()=>{
    setIntegrationSecret('tenant-b','STRIPE','another-secret-123','SANDBOX')
    const tenantA=listIntegrationSecrets('tenant-a')
    expect(tenantA.every(item=>item.tenantId==='tenant-a')).toBe(true)
  })
})
