import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import crypto from 'node:crypto'
import { underwrite, creativeStructures } from './underwriting'
import { auditEvent, lifecycleStages, transitionLifecycle, type LifecycleStage } from './dealLifecycle'
import { matchLenders } from './serverModules'
import { complianceGate, generateOfferPacket, lenderBinder } from './release2'
import { normalizeBid, auditTitleCommitment, auditSettlement, createClosingChecklist } from './release3'
import { verifyRehabDraw, calculateScheduleENoi, triageMaintenance, createPostCloseChecklist } from './release4'
import { MockListingProvider, deduplicateListings } from './providerAdapters'
import { mountMcpServer } from './mcp'
import { pricingTiers, consumeCredit, meterOverage } from './subscriptions'
import { requireAuth, requireRoles, signSession } from './auth'
import { setIntegrationSecret, listIntegrationSecrets, type IntegrationProvider } from './integrationVault'

const app = express()
app.use(cors())
app.use(express.json())

const dealSchema = z.object({
  address: z.string().min(3),
  city: z.string().min(2),
  propertyType: z.string().min(2),
  purchasePrice: z.number().nonnegative(),
  arv: z.number().nonnegative().optional().default(0),
  rehabCost: z.number().nonnegative().optional().default(0),
  monthlyRent: z.number().nonnegative().optional().default(0),
})

const deals: Array<Record<string, any>> = []
const rfqs: Array<Record<string, any>> = []
const auditLog: Array<Record<string, any>> = []

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'reos-api', timestamp: new Date().toISOString() })
})

app.get('/api/v1/deals', requireAuth, (_req, res) => res.json({ data: deals }))

app.post('/api/v1/deals', requireAuth, requireRoles('OWNER','ADMIN','ANALYST'), (req, res) => {
  const parsed = dealSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid deal data', details: parsed.error.flatten() })

  const d = parsed.data
  const analysis = underwrite({
    purchasePrice: d.purchasePrice,
    arv: d.arv,
    rehabCost: d.rehabCost,
    monthlyRent: d.monthlyRent,
  })
  const deal = {
    id: crypto.randomUUID(),
    ...d,
    lifecycleStage: 'SOURCED' as LifecycleStage,
    underwriting: analysis,
    auditTrail: [] as Record<string, any>[],
    createdAt: new Date().toISOString(),
  }
  deals.unshift(deal)
  res.status(201).json({ data: deal })
})

app.post('/api/v1/underwrite/analyze', (req, res) => {
  const parsed = dealSchema.partial({ address: true, city: true, propertyType: true }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid underwriting input', details: parsed.error.flatten() })
  const d = parsed.data
  res.json(underwrite({
    purchasePrice: d.purchasePrice,
    arv: d.arv,
    rehabCost: d.rehabCost,
    monthlyRent: d.monthlyRent,
  }))
})

app.post('/api/v1/creative-finance/analyze', (req, res) => {
  const parsed = dealSchema.extend({ existingLoanBalance: z.number().nonnegative().optional(), existingRate: z.number().min(0).max(1).optional() }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid creative-finance input', details: parsed.error.flatten() })
  res.json({ data: creativeStructures(parsed.data) })
})

app.post('/api/v1/lenders/match', (req, res) => {
  const schema = z.object({ propertyType: z.string(), ltv: z.number().min(0).max(1), dscr: z.number().nonnegative() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid lender criteria', details: parsed.error.flatten() })
  res.json({ data: matchLenders(parsed.data.propertyType, parsed.data.ltv, parsed.data.dscr) })
})

app.post('/api/v1/deals/:dealId/transition', requireAuth, requireRoles('OWNER','ADMIN'), (req, res) => {
  const deal = deals.find((item) => item.id === req.params.dealId)
  if (!deal) return res.status(404).json({ error: 'Deal not found' })

  const parsed = z.object({ toStage: z.enum(lifecycleStages), approvedBy: z.string().min(2) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid transition', details: parsed.error.flatten() })

  const result = transitionLifecycle(deal.lifecycleStage as LifecycleStage, parsed.data.toStage)
  if (!result.ok) return res.status(409).json({ error: result.error })

  deal.lifecycleStage = result.stage
  const event = auditEvent(deal.id, req.body.fromStage || 'Unknown', result.stage, parsed.data.approvedBy)
  deal.auditTrail.unshift(event)
  auditLog.unshift(event)
  res.json({ data: deal, event })
})

app.get('/api/v1/audit', (_req, res) => res.json({ data: auditLog }))

app.post('/api/v1/rfqs', (req, res) => {
  const schema = z.object({ dealId: z.string().uuid(), tradeCategory: z.string().min(2), scopeItems: z.array(z.object({ item: z.string(), quantity: z.number().positive(), baselineUnitCost: z.number().nonnegative() })).min(1), dueInDays: z.number().int().min(1).max(30) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid RFQ', details: parsed.error.flatten() })
  if (!deals.some((deal) => deal.id === parsed.data.dealId)) return res.status(404).json({ error: 'Deal not found' })

  const rfq = {
    id: crypto.randomUUID(),
    ...parsed.data,
    status: 'OPEN',
    bids: [],
    createdAt: new Date().toISOString(),
  }
  rfqs.unshift(rfq)
  res.status(201).json({ data: rfq })
})

app.get('/api/v1/rfqs', (_req, res) => res.json({ data: rfqs }))

app.post('/api/v1/compliance/check', (req, res) => {
  const schema = z.object({ state:z.string().length(2), channel:z.enum(['VOICE','SMS','EMAIL','DIRECT_MAIL']), dncScrubbed:z.boolean(), litigatorScrubbed:z.boolean(), consentVerified:z.boolean() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error:'Invalid compliance context', details:parsed.error.flatten() })
  res.json({ data: complianceGate(parsed.data) })
})

app.post('/api/v1/offers/generate', (req, res) => {
  const schema = z.object({ dealId:z.string().uuid(), contractType:z.enum(['PSA','LOI','SUB_TO_ADDENDUM','NOVATION']), offerAmount:z.number().positive(), closingDate:z.string(), state:z.string().length(2) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error:'Invalid offer packet', details:parsed.error.flatten() })
  if (!deals.some(deal => deal.id === parsed.data.dealId)) return res.status(404).json({ error:'Deal not found' })
  res.status(201).json({ data:generateOfferPacket(parsed.data) })
})

app.post('/api/v1/lenders/binder', (req, res) => {
  const parsed = z.object({ dealId:z.string().uuid() }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error:'Invalid binder request' })
  const deal = deals.find(item => item.id === parsed.data.dealId)
  if (!deal) return res.status(404).json({ error:'Deal not found' })
  res.json({ data:lenderBinder(deal) })
})

app.post('/api/v1/bids/normalize', (req, res) => {
  const schema=z.object({lines:z.array(z.object({item:z.string(),quantity:z.number().positive(),unitCost:z.number().nonnegative()})).min(1),baseline:z.array(z.object({item:z.string(),quantity:z.number().positive(),unitCost:z.number().nonnegative()})).min(1)})
  const parsed=schema.safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid bid normalization input',details:parsed.error.flatten()})
  res.json({data:normalizeBid(parsed.data.lines,parsed.data.baseline)})
})

app.post('/api/v1/closing/title-audit',(req,res)=>{
  const schema=z.object({mortgages:z.number().int().nonnegative(),municipalLiens:z.number().int().nonnegative(),easements:z.number().int().nonnegative(),taxCertificates:z.number().int().nonnegative()})
  const parsed=schema.safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid title audit'})
  res.json({data:auditTitleCommitment(parsed.data)})
})

app.post('/api/v1/closing/settlement-audit',(req,res)=>{
  const line=z.object({description:z.string(),amount:z.number()})
  const parsed=z.object({proposed:z.array(line),underwriting:z.array(line)}).safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid settlement audit'})
  res.json({data:auditSettlement(parsed.data.proposed,parsed.data.underwriting)})
})

app.post('/api/v1/closing/checklist',(req,res)=>{
  const parsed=z.object({dealId:z.string().uuid()}).safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid closing checklist request'})
  res.status(201).json({data:createClosingChecklist(parsed.data.dealId)})
})

app.post('/api/v1/release4/rehab-draw/verify', (req, res) => {
  const schema = z.object({
    dealId: z.string().uuid(),
    drawAmount: z.number().positive(),
    drawDescription: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid rehab draw data', details: parsed.error.flatten() })
  res.json({ data: verifyRehabDraw(parsed.data) })
})

app.post('/api/v1/release4/schedule-e/calculate', (req, res) => {
  const schema = z.object({
    dealId: z.string().uuid(),
    noi: z.number().optional(),
    expenses: z.object({
      propertyManagement: z.number().nonnegative().optional(),
      repairs: z.number().nonnegative().optional(),
      utilities: z.number().nonnegative().optional(),
      other: z.number().nonnegative().optional(),
    }).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid Schedule E data', details: parsed.error.flatten() })
  res.json({ data: calculateScheduleENoi(parsed.data) })
})

app.post('/api/v1/release4/maintenance/triage', (req, res) => {
  const schema = z.object({
    dealId: z.string().uuid(),
    issueDescription: z.string().min(5),
    urgencyLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid maintenance request', details: parsed.error.flatten() })
  res.json({ data: triageMaintenance(parsed.data) })
})

app.post('/api/v1/release4/post-close/checklist', (req, res) => {
  const schema = z.object({
    dealId: z.string().uuid(),
    itemsReviewed: z.array(z.string()).min(1),
    followUpNeeded: z.boolean().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid post-close checklist data', details: parsed.error.flatten() })
  res.json({ data: createPostCloseChecklist(parsed.data) })
})

app.post('/api/v1/post-close/draw', (req,res)=>{
  const schema=z.object({name:z.string(),drawAmount:z.number().positive(),verificationPhotoUrls:z.array(z.string().url()).min(0),humanApproved:z.boolean()})
  const parsed=schema.safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid draw request',details:parsed.error.flatten()})
  res.json({data:verifyRehabDraw(parsed.data,parsed.data.humanApproved)})
})

app.post('/api/v1/post-close/schedule-e',(req,res)=>{
  const schema=z.object({entries:z.array(z.object({entryType:z.enum(['INCOME','EXPENSE']),amount:z.number().nonnegative()}))})
  const parsed=schema.safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid ledger entries'})
  res.json({data:calculateScheduleENoi(parsed.data.entries)})
})

app.post('/api/v1/post-close/maintenance',(req,res)=>{
  const parsed=z.object({description:z.string().min(3),approvedSpendCap:z.number().nonnegative()}).safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid maintenance ticket'})
  res.json({data:triageMaintenance(parsed.data.description,parsed.data.approvedSpendCap)})
})

app.post('/api/v1/post-close/checklist',(req,res)=>{
  const parsed=z.object({propertyId:z.string().uuid()}).safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid property ID'})
  res.status(201).json({data:createPostCloseChecklist(parsed.data.propertyId)})
})

app.post('/api/v1/sourcing/search',(req,res)=>{
  const parsed=z.object({state:z.string().length(2),city:z.string().optional(),source:z.enum(['MLS','OFF_MARKET','TAX_DEED','PROBATE','HUD','AUCTION_COM','LAND_BANK']).optional()}).safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid sourcing query'})
  const provider=new MockListingProvider(parsed.data.source||'MLS')
  provider.search(parsed.data.state,parsed.data.city).then(listings=>res.json({data:deduplicateListings(listings)}))
})

app.get('/api/v1/subscriptions/pricing',(_req,res)=>res.json({data:pricingTiers}))
app.post('/api/v1/subscriptions/credits/consume',(req,res)=>{
  const parsed=z.object({balance:z.number().nonnegative(),cost:z.number().nonnegative()}).safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid credit request'})
  const result=consumeCredit(parsed.data.balance,parsed.data.cost)
  return result.ok?res.json({data:result}):res.status(402).json({error:result.error,data:result})
})
app.get('/api/v1/subscriptions/overages/:action',(req,res)=>{
  const action=req.params.action as 'SKIP_TRACE'|'VOICE_MINUTE'|'ESIGN'|'VISION'|'RFQ'
  if(!['SKIP_TRACE','VOICE_MINUTE','ESIGN','VISION','RFQ'].includes(action))return res.status(400).json({error:'Unknown metered action'})
  res.json({data:meterOverage(action)})
})

const port = Number(process.env.PORT || 4100)
app.listen(port, () => console.log(`RE-OS API listening on port ${port}`))

mountMcpServer(app,(input)=>underwrite({purchasePrice:input.purchasePrice||0,arv:input.arv||0,rehabCost:input.rehabCost||0,monthlyRent:input.monthlyRent||0}))

app.post('/api/v1/auth/login',(req,res)=>{
  const parsed=z.object({email:z.string().email(),tenantId:z.string().min(2),role:z.enum(['OWNER','ADMIN','ANALYST','FIELD','CONTRACTOR','TENANT','VIEWER']).optional().default('OWNER')}).safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid login request',details:parsed.error.flatten()})
  const principal={tenantId:parsed.data.tenantId,userId:crypto.randomUUID(),role:parsed.data.role,email:parsed.data.email}
  res.json({data:{accessToken:signSession(principal),principal,expiresIn:'8h'}})
})

app.get('/api/v1/session',requireAuth,(req,res)=>res.json({data:(req as any).principal}))

app.post('/api/v1/integrations/configure',requireAuth,requireRoles('OWNER','ADMIN'),(req,res)=>{
  const providers=['REAL_ESTATE_API','BRIDGE_RESO','TWILIO','VAPI','DROPBOX_SIGN','PLAID','STRIPE','ANTHROPIC'] as const
  const parsed=z.object({provider:z.enum(providers),secret:z.string().min(8),status:z.enum(['SANDBOX','CONNECTED','DISABLED']).optional()}).safeParse(req.body)
  if(!parsed.success)return res.status(400).json({error:'Invalid integration configuration'})
  const principal=(req as any).principal
  const result=setIntegrationSecret(principal.tenantId,parsed.data.provider as IntegrationProvider,parsed.data.secret,parsed.data.status)
  res.status(201).json({data:result})
})

app.get('/api/v1/integrations',requireAuth,(req,res)=>{
  const principal=(req as any).principal
  res.json({data:listIntegrationSecrets(principal.tenantId)})
})
