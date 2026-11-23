import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import crypto from 'node:crypto'
import { underwrite, creativeStructures } from './underwriting'
import { auditEvent, lifecycleStages, transitionLifecycle, type LifecycleStage } from './dealLifecycle'
import { matchLenders } from './serverModules'
import { complianceGate, generateOfferPacket, lenderBinder } from './release2'
import { normalizeBid, auditTitleCommitment, auditSettlement, createClosingChecklist } from './release3'

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

app.get('/api/v1/deals', (_req, res) => res.json({ data: deals }))

app.post('/api/v1/deals', (req, res) => {
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

app.post('/api/v1/deals/:dealId/transition', (req, res) => {
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

const port = Number(process.env.PORT || 4100)
app.listen(port, () => console.log(`RE-OS API listening on port ${port}`))
