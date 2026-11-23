import crypto from 'node:crypto'

export type IntegrationProvider = 'REAL_ESTATE_API'|'BRIDGE_RESO'|'TWILIO'|'VAPI'|'DROPBOX_SIGN'|'PLAID'|'STRIPE'|'ANTHROPIC'

const vault=new Map<string,{provider:IntegrationProvider;tenantId:string;encryptedSecret:string;status:'SANDBOX'|'CONNECTED'|'DISABLED';createdAt:string}>()

function encryptSecret(secret:string) {
  const key=process.env.REOS_INTEGRATION_VAULT_KEY||'development-vault-key-change-me'
  const cipherKey=crypto.createHash('sha256').update(key).digest()
  const iv=crypto.randomBytes(16)
  const cipher=crypto.createCipheriv('aes-256-cbc',cipherKey,iv)
  const encrypted=cipher.update(secret,'utf8','base64')+cipher.final('base64')
  return `${iv.toString('base64')}.${encrypted}`
}

export function setIntegrationSecret(tenantId:string,provider:IntegrationProvider,secret:string,status:'SANDBOX'|'CONNECTED'|'DISABLED'='SANDBOX') {
  const id=crypto.randomUUID()
  vault.set(id,{provider,tenantId,encryptedSecret:encryptSecret(secret),status,createdAt:new Date().toISOString()})
  return{id,provider,tenantId,status,secretStored:true}
}

export function listIntegrationSecrets(tenantId:string) {
  return [...vault.values()].filter(item=>item.tenantId===tenantId).map(({encryptedSecret,...safe})=>safe)
}
