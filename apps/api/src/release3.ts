import crypto from 'node:crypto'

export type BidLine = { item:string; quantity:number; unitCost:number }

export function normalizeBid(lines:BidLine[], baseline:BidLine[]) {
  const baselineMap = new Map(baseline.map(line => [line.item.toLowerCase(), line]))
  const normalized = lines.map(line => {
    const base = baselineMap.get(line.item.toLowerCase())
    const baseTotal = base ? base.quantity * base.unitCost : 0
    const bidTotal = line.quantity * line.unitCost
    return {
      item: line.item,
      quantity: line.quantity,
      unitCost: line.unitCost,
      bidTotal,
      baselineTotal: baseTotal,
      variance: baseTotal ? bidTotal - baseTotal : bidTotal,
      missingFromBaseline: !base,
    }
  })
  const baselineTotal = baseline.reduce((sum,line) => sum + line.quantity * line.unitCost, 0)
  const bidTotal = lines.reduce((sum,line) => sum + line.quantity * line.unitCost, 0)
  return {
    bidId: crypto.randomUUID(),
    bidTotal,
    baselineTotal,
    variance: bidTotal - baselineTotal,
    missingScope: normalized.filter(line => line.missingFromBaseline).map(line => line.item),
    outlier: normalized.filter(line => line.baselineTotal > 0 && Math.abs(line.variance) / line.baselineTotal >= 0.20).map(line => line.item),
    normalizedLineItems: normalized,
  }
}

export function auditTitleCommitment(input:{mortgages:number;municipalLiens:number;easements:number;taxCertificates:number}) {
  const flags = {
    unreleasedMortgages: input.mortgages,
    municipalCodeLiens: input.municipalLiens,
    easements: input.easements,
    taxCertificates: input.taxCertificates,
  }
  const issueCount = Object.values(flags).reduce((sum,value) => sum + value, 0)
  return { clearToClose:issueCount===0, issueCount, flags, reviewedAt:new Date().toISOString() }
}

export function auditSettlement(proposedLineItems:{description:string;amount:number}[], underwritingLineItems:{description:string;amount:number}[]) {
  const model = new Map(underwritingLineItems.map(line => [line.description.toLowerCase(), line.amount]))
  const variances = proposedLineItems.map(line => {
    const expected = model.get(line.description.toLowerCase()) || 0
    return {description:line.description, proposed:line.amount, underwriting:expected, variance:line.amount-expected}
  })
  return {
    auditedAt:new Date().toISOString(),
    varianceTotal:variances.reduce((sum,line) => sum + line.variance, 0),
    requiresReview:variances.some(line => Math.abs(line.variance)>=100),
    variances,
  }
}

export function createClosingChecklist(dealId:string) {
  return {
    dealId,
    tasks:['Title commitment','ALTA/HUD-1 audit','Hazard insurance','Builder risk','RON appointment','Wire verification','Final settlement'],
    status:'IN_PROGRESS',
    wireVerified:false,
    createdAt:new Date().toISOString(),
  }
}
