import express from 'express'
import cors from 'cors'
import { z } from 'zod'

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

const deals: any[] = []

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'reos-api', timestamp: new Date().toISOString() }))

app.get('/api/v1/deals', (_req, res) => res.json({ data: deals }))

app.post('/api/v1/deals', (req, res) => {
  const parsed = dealSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid deal data', details: parsed.error.flatten() })
  const d = parsed.data
  const grossProfit = d.arv - d.purchasePrice - d.rehabCost
  const cashOnCash = d.purchasePrice > 0 ? grossProfit / d.purchasePrice : 0
  const deal = {
    id: crypto.randomUUID(),
    ...d,
    lifecycleStage: 'SOURCED',
    underwriting: {
      engineVersion: '1.0.0',
      grossProfit,
      cashOnCash,
      estimatedMonthlyRent: d.monthlyRent,
      rank: grossProfit > 0 ? 'Review' : 'Reject',
    },
    createdAt: new Date().toISOString(),
  }
  deals.unshift(deal)
  res.status(201).json({ data: deal })
})

app.post('/api/v1/underwrite/analyze', (req, res) => {
  const parsed = dealSchema.partial({ address: true, city: true, propertyType: true }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid underwriting input', details: parsed.error.flatten() })
  const d = parsed.data
  const netProfit = d.arv - d.purchasePrice - d.rehabCost
  const annualNoi = d.monthlyRent * 12
  res.json({
    netProfit,
    cashOnCash: d.purchasePrice ? netProfit / d.purchasePrice : 0,
    annualNoi,
    dscr: d.monthlyRent ? (d.monthlyRent * 0.75) / (d.purchasePrice * 0.005) : 0,
    capRate: d.purchasePrice ? annualNoi / d.purchasePrice : 0,
  })
})

const port = Number(process.env.PORT || 4100)
app.listen(port, () => console.log(`RE-OS API listening on port ${port}`))
